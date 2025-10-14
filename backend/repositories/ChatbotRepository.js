/**
 * Chatbot Repository
 * Handles database operations for FAQ system and chat conversations
 */

const db = require('../config/db')
const logger = require('../config/logger')

class ChatbotRepository {
  // ============================================
  // DYNAMIC DATA FETCHING
  // ============================================

  /**
   * Get document catalog with current fees
   */
  static async getDocumentCatalog() {
    try {
      const query = `
        SELECT 
          id,
          title,
          description,
          fee,
          is_active
        FROM document_catalog 
        WHERE is_active = 1
        ORDER BY title ASC
      `
      const result = await db.query(query)
      return result.rows
    } catch (error) {
      logger.error('Error fetching document catalog:', error)
      throw error
    }
  }

  /**
   * Get specific document fee by title
   */
  static async getDocumentFee(documentTitle) {
    try {
      const query = `
        SELECT fee, title
        FROM document_catalog 
        WHERE LOWER(title) LIKE LOWER($1) AND is_active = 1
        LIMIT 1
      `
      const result = await db.query(query, [`%${documentTitle}%`])
      return result.rows.length > 0 ? result.rows[0] : null
    } catch (error) {
      logger.error('Error fetching document fee:', error)
      throw error
    }
  }

  /**
   * Format document catalog for FAQ display
   */
  static async getFormattedDocumentList() {
    try {
      const documents = await this.getDocumentCatalog()
      return documents.map(doc => {
        const fee = parseFloat(doc.fee) === 0 ? 'FREE' : `₱${parseFloat(doc.fee).toFixed(2)}`
        return `• **${doc.title}**: ${fee}`
      }).join('\n')
    } catch (error) {
      logger.error('Error formatting document list:', error)
      return 'Document list temporarily unavailable. Please contact the barangay office.'
    }
  }

  /**
   * Get permits only from document catalog
   */
  static async getFormattedPermitList() {
    try {
      const query = `
        SELECT title, fee, description
        FROM document_catalog 
        WHERE LOWER(title) LIKE '%permit%' AND is_active = 1
        ORDER BY title ASC
      `
      const result = await db.query(query)
      return result.rows.map(doc => {
        const fee = parseFloat(doc.fee) === 0 ? 'FREE' : `₱${parseFloat(doc.fee).toFixed(2)}`
        return `• **${doc.title}**: ${fee}\n  ${doc.description}`
      }).join('\n\n')
    } catch (error) {
      logger.error('Error formatting permit list:', error)
      return 'Permit list temporarily unavailable. Please contact the barangay office.'
    }
  }

  /**
   * Get formatted fees list for all documents
   */
  static async getFormattedFeesList() {
    try {
      const documents = await this.getDocumentCatalog()
      const grouped = {
        free: [],
        paid: []
      }

      documents.forEach(doc => {
        const fee = parseFloat(doc.fee)
        if (fee === 0) {
          grouped.free.push(doc.title)
        } else {
          grouped.paid.push(`• **${doc.title}**: ₱${fee.toFixed(2)}`)
        }
      })

      let result = ''
      
      if (grouped.paid.length > 0) {
        result += '**Paid Documents:**\n' + grouped.paid.join('\n') + '\n\n'
      }
      
      if (grouped.free.length > 0) {
        result += '**Free Documents:**\n' + grouped.free.map(title => `• **${title}**: FREE`).join('\n')
      }

      return result
    } catch (error) {
      logger.error('Error formatting fees list:', error)
      return 'Fee information temporarily unavailable. Please contact the barangay office.'
    }
  }

  /**
   * Process FAQ answer with dynamic data replacement
   */
  static async processDynamicAnswer(answer) {
    try {
      let processedAnswer = answer

      // Replace document catalog list
      if (answer.includes('{{DOCUMENT_CATALOG_LIST}}')) {
        const documentList = await this.getFormattedDocumentList()
        processedAnswer = processedAnswer.replace('{{DOCUMENT_CATALOG_LIST}}', documentList)
      }

      // Replace document fees list
      if (answer.includes('{{DOCUMENT_FEES_LIST}}')) {
        const feesList = await this.getFormattedFeesList()
        processedAnswer = processedAnswer.replace('{{DOCUMENT_FEES_LIST}}', feesList)
      }

      // Replace permit catalog list
      if (answer.includes('{{PERMIT_CATALOG_LIST}}')) {
        const permitList = await this.getFormattedPermitList()
        processedAnswer = processedAnswer.replace('{{PERMIT_CATALOG_LIST}}', permitList)
      }

      // Replace specific document fees
      const feeMatches = answer.match(/\{\{([A-Z_]+)_FEE\}\}/g)
      if (feeMatches) {
        for (const match of feeMatches) {
          const documentType = match.replace('{{', '').replace('_FEE}}', '').replace(/_/g, ' ')
          const docInfo = await this.getDocumentFee(documentType)
          if (docInfo) {
            const feeText = parseFloat(docInfo.fee) === 0 ? 'FREE' : `₱${parseFloat(docInfo.fee).toFixed(2)}`
            processedAnswer = processedAnswer.replace(match, feeText)
          } else {
            processedAnswer = processedAnswer.replace(match, 'Contact barangay office')
          }
        }
      }

      return processedAnswer
    } catch (error) {
      logger.error('Error processing dynamic answer:', error)
      return answer // Return original answer if processing fails
    }
  }

  /**
   * Get recent published announcements for AI context
   */
  static async getRecentAnnouncements(limit = 3) {
    try {
      const query = `
        SELECT 
          title,
          content,
          type,
          published_at
        FROM announcements 
        WHERE published_at IS NOT NULL 
          AND published_at <= NOW()
        ORDER BY published_at DESC 
        LIMIT $1
      `
      const result = await db.query(query, [limit])
      return result.rows
    } catch (error) {
      logger.error('Error fetching recent announcements:', error)
      return []
    }
  }

  // ============================================
  // CHAT MESSAGE ANALYSIS & AI IMPROVEMENT
  // ============================================

  /**
   * Get frequently asked questions from chat messages that weren't answered by FAQs
   */
  static async getUnansweredQuestions(limit = 20) {
    try {
      const query = `
        SELECT 
          cm.message_text as user_question,
          COUNT(*) as frequency,
          AVG(CASE WHEN cm2.was_helpful = 1 THEN 1 ELSE 0 END) as satisfaction_rate,
          MAX(cm.created_at) as last_asked
        FROM chat_messages cm
        LEFT JOIN chat_messages cm2 ON cm2.conversation_id = cm.conversation_id 
          AND cm2.id > cm.id 
          AND cm2.message_type = 'bot'
        WHERE cm.message_type = 'user'
          AND cm.faq_id IS NULL  -- Not answered by existing FAQ
          AND LENGTH(cm.message_text) > 10  -- Meaningful questions
          AND cm.created_at >= NOW() - INTERVAL '30 days'  -- Recent questions
        GROUP BY cm.message_text
        HAVING COUNT(*) >= 2  -- Asked multiple times
        ORDER BY frequency DESC, last_asked DESC
        LIMIT $1
      `
      const result = await db.query(query, [limit])
      return result.rows
    } catch (error) {
      logger.error('Error getting unanswered questions:', error)
      throw error
    }
  }

  /**
   * Get conversation context for improving AI responses
   */
  static async getConversationContext(conversationId, messageLimit = 10) {
    try {
      const query = `
        SELECT 
          cm.message_type,
          cm.message_text,
          cm.faq_id,
          cm.was_helpful,
          cm.created_at,
          f.question as faq_question,
          f.answer as faq_answer
        FROM chat_messages cm
        LEFT JOIN faqs f ON cm.faq_id = f.id
        WHERE cm.conversation_id = $1
        ORDER BY cm.created_at ASC
        LIMIT $2
      `
      const result = await db.query(query, [conversationId, messageLimit])
      return result.rows
    } catch (error) {
      logger.error('Error getting conversation context:', error)
      throw error
    }
  }

  /**
   * Get similar user questions from chat history (with fallback for missing pg_trgm)
   */
  static async getSimilarUserQuestions(userQuestion, limit = 5) {
    try {
      // First try using similarity function (requires pg_trgm extension)
      const similarityQuery = `
        SELECT DISTINCT
          cm.message_text as question,
          cm2.message_text as bot_response,
          cm2.faq_id,
          cm2.was_helpful,
          f.question as faq_question,
          f.answer as faq_answer,
          similarity(cm.message_text, $1) as similarity_score
        FROM chat_messages cm
        LEFT JOIN chat_messages cm2 ON cm2.conversation_id = cm.conversation_id 
          AND cm2.id > cm.id 
          AND cm2.message_type = 'bot'
          AND cm2.id = (
            SELECT MIN(id) FROM chat_messages 
            WHERE conversation_id = cm.conversation_id 
              AND id > cm.id 
              AND message_type = 'bot'
          )
        LEFT JOIN faqs f ON cm2.faq_id = f.id
        WHERE cm.message_type = 'user'
          AND similarity(cm.message_text, $1) > 0.3
          AND cm.created_at >= NOW() - INTERVAL '90 days'
        ORDER BY similarity_score DESC, cm2.was_helpful DESC NULLS LAST
        LIMIT $2
      `
      
      try {
        const result = await db.query(similarityQuery, [userQuestion, limit])
        return result.rows
      } catch (similarityError) {
        // If similarity function doesn't exist, fall back to ILIKE search
        logger.warn('Similarity function not available, using ILIKE fallback', { 
          error: similarityError.message 
        })
        
        const fallbackQuery = `
          SELECT DISTINCT
            cm.message_text as question,
            cm2.message_text as bot_response,
            cm2.faq_id,
            cm2.was_helpful,
            f.question as faq_question,
            f.answer as faq_answer,
            0.5 as similarity_score
          FROM chat_messages cm
          LEFT JOIN chat_messages cm2 ON cm2.conversation_id = cm.conversation_id 
            AND cm2.id > cm.id 
            AND cm2.message_type = 'bot'
            AND cm2.id = (
              SELECT MIN(id) FROM chat_messages 
              WHERE conversation_id = cm.conversation_id 
                AND id > cm.id 
                AND message_type = 'bot'
            )
          LEFT JOIN faqs f ON cm2.faq_id = f.id
          WHERE cm.message_type = 'user'
            AND (
              cm.message_text ILIKE '%' || $1 || '%'
              OR $1 ILIKE '%' || cm.message_text || '%'
            )
            AND cm.created_at >= NOW() - INTERVAL '90 days'
          ORDER BY cm2.was_helpful DESC NULLS LAST, cm.created_at DESC
          LIMIT $2
        `
        
        const fallbackResult = await db.query(fallbackQuery, [userQuestion, limit])
        return fallbackResult.rows
      }
    } catch (error) {
      logger.error('Error getting similar questions:', error)
      throw error
    }
  }

  /**
   * Get feedback patterns to improve FAQ quality
   */
  static async getFAQFeedbackAnalysis() {
    try {
      const query = `
        SELECT 
          f.id as faq_id,
          f.question,
          f.answer,
          COUNT(cm.id) as times_used,
          COUNT(CASE WHEN cm.was_helpful = 1 THEN 1 END) as helpful_count,
          COUNT(CASE WHEN cm.was_helpful = 0 THEN 1 END) as not_helpful_count,
          ROUND(
            AVG(CASE WHEN cm.was_helpful IS NOT NULL THEN cm.was_helpful::float END) * 100, 2
          ) as satisfaction_percentage,
          MAX(cm.created_at) as last_used
        FROM faqs f
        LEFT JOIN chat_messages cm ON f.id = cm.faq_id
        WHERE f.is_active = 1
          AND cm.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY f.id, f.question, f.answer
        HAVING COUNT(cm.id) > 0
        ORDER BY satisfaction_percentage ASC NULLS LAST, times_used DESC
      `
      const result = await db.query(query)
      return result.rows
    } catch (error) {
      logger.error('Error getting FAQ feedback analysis:', error)
      throw error
    }
  }

  /**
   * Get chat message statistics for AI training insights
   */
  static async getChatStatistics(days = 30) {
    try {
      const query = `
        SELECT 
          DATE(created_at) as chat_date,
          COUNT(*) as total_messages,
          COUNT(CASE WHEN message_type = 'user' THEN 1 END) as user_messages,
          COUNT(CASE WHEN message_type = 'bot' THEN 1 END) as bot_messages,
          COUNT(CASE WHEN faq_id IS NOT NULL THEN 1 END) as faq_responses,
          COUNT(CASE WHEN was_helpful = 1 THEN 1 END) as helpful_responses,
          COUNT(CASE WHEN was_helpful = 0 THEN 1 END) as unhelpful_responses,
          ROUND(
            AVG(CASE WHEN was_helpful IS NOT NULL THEN was_helpful::float END) * 100, 2
          ) as daily_satisfaction
        FROM chat_messages
        WHERE created_at >= NOW() - INTERVAL '$1 days'
        GROUP BY DATE(created_at)
        ORDER BY chat_date DESC
      `
      const result = await db.query(query.replace('$1', days))
      return result.rows
    } catch (error) {
      logger.error('Error getting chat statistics:', error)
      throw error
    }
  }

  /**
   * Build AI context from chat history and FAQs
   */
  static async buildAIContext(userQuestion, conversationId = null) {
    try {
      const context = {
        userQuestion,
        documentCatalog: await this.getDocumentCatalog(),
        recentConversation: conversationId ? await this.getConversationContext(conversationId, 5) : [],
        similarQuestions: await this.getSimilarUserQuestions(userQuestion, 3),
        topFAQs: await this.getFAQs(), // Get all FAQs for context
        currentTimestamp: new Date().toISOString()
      }

      return context
    } catch (error) {
      logger.error('Error building AI context:', error)
      throw error
    }
  }

  /**
   * Get enhanced FAQ response with chat message context
   */
  static async getEnhancedFAQResponse(userQuestion, conversationId = null) {
    try {
      // First try to find exact FAQ match
      const faqResults = await this.searchFAQs(userQuestion)
      
      if (faqResults.length > 0) {
        const bestMatch = faqResults[0]
        
        // Get similar conversation patterns
        const similarQuestions = await this.getSimilarUserQuestions(userQuestion, 3)
        
        // Enhance the FAQ answer with context from similar conversations
        let enhancedAnswer = bestMatch.answer
        
        if (similarQuestions.length > 0) {
          const successfulResponses = similarQuestions.filter(q => q.was_helpful === 1)
          if (successfulResponses.length > 0) {
            enhancedAnswer += `\n\n**Additional Information Based on Similar Questions:**\n`
            successfulResponses.slice(0, 2).forEach(response => {
              if (response.bot_response && response.bot_response !== bestMatch.answer) {
                enhancedAnswer += `• ${response.bot_response}\n`
              }
            })
          }
        }
        
        return {
          faqId: bestMatch.id,
          question: bestMatch.question,
          answer: enhancedAnswer,
          confidence: faqResults[0].relevance || 1,
          hasEnhancement: similarQuestions.length > 0
        }
      }
      
      return null
    } catch (error) {
      logger.error('Error getting enhanced FAQ response:', error)
      throw error
    }
  }
  // ============================================
  // FAQ CATEGORIES
  // ============================================

  /**
   * Get all active FAQ categories
   */
  static async getCategories() {
    const query = `
      SELECT 
        id, 
        category_name, 
        description, 
        icon,
        display_order,
        (SELECT COUNT(*) FROM faqs WHERE category_id = faq_categories.id AND is_active = 1) as faq_count
      FROM faq_categories
      WHERE is_active = 1
      ORDER BY display_order ASC, category_name ASC
    `
    const result = await db.query(query)
    return result.rows
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(categoryId) {
    const query = `
      SELECT * FROM faq_categories 
      WHERE id = $1 AND is_active = 1
    `
    const result = await db.query(query, [categoryId])
    return result.rows.length > 0 ? result.rows[0] : null
  }

  // ============================================
  // FAQs
  // ============================================

  /**
   * Get all active FAQs (optionally filtered by category) with dynamic data processing
   */
  static async getFAQs(categoryId = null) {
    let query = `
      SELECT 
        f.id,
        f.category_id,
        c.category_name,
        f.question,
        f.answer,
        f.keywords,
        f.view_count,
        f.helpful_count,
        f.not_helpful_count,
        c.display_order as category_display_order
      FROM faqs f
      JOIN faq_categories c ON f.category_id = c.id
      WHERE f.is_active = 1
    `
    const params = []

    if (categoryId) {
      query += ` AND f.category_id = $1`
      params.push(categoryId)
    }

    query += ` ORDER BY c.display_order ASC, f.id ASC`

    const result = await db.query(query, params)
    
    // Process dynamic content for all FAQs
    for (const faq of result.rows) {
      faq.answer = await this.processDynamicAnswer(faq.answer)
    }
    
    return result.rows
  }

  /**
   * Get FAQ by ID with dynamic data processing
   */
  static async getFAQById(faqId) {
    const query = `
      SELECT 
        f.id,
        f.category_id,
        c.category_name,
        f.question,
        f.answer,
        f.keywords,
        f.view_count,
        f.helpful_count,
        f.not_helpful_count
      FROM faqs f
      JOIN faq_categories c ON f.category_id = c.id
      WHERE f.id = $1 AND f.is_active = 1
    `
    const result = await db.query(query, [faqId])
    
    if (result.rows.length > 0) {
      const faq = result.rows[0]
      // Process dynamic content in the answer
      faq.answer = await this.processDynamicAnswer(faq.answer)
      return faq
    }
    
    return null
  }

  /**
   * Search FAQs by query string with dynamic data processing
   */
  static async searchFAQs(searchQuery) {
    // For very short queries (1-2 characters), use exact word matching only
    const isShortQuery = searchQuery.trim().length <= 2
    
    const query = `
      SELECT 
        f.id,
        f.category_id,
        c.category_name,
        f.question,
        f.answer,
        f.keywords,
        f.view_count,
        f.helpful_count,
        f.not_helpful_count,
        -- Ranking: prioritize question matches over answer/keywords
        ts_rank(to_tsvector('english', f.question), plainto_tsquery('english', $1)) * 3 +
        ts_rank(to_tsvector('english', f.keywords), plainto_tsquery('english', $1)) * 2 +
        ts_rank(to_tsvector('english', f.answer), plainto_tsquery('english', $1)) as relevance
      FROM faqs f
      JOIN faq_categories c ON f.category_id = c.id
      WHERE f.is_active = 1
      AND (
        to_tsvector('english', f.question) @@ plainto_tsquery('english', $1) OR
        to_tsvector('english', f.keywords) @@ plainto_tsquery('english', $1) OR
        ${isShortQuery 
          ? "f.keywords ~* ('\\y' || $1 || '\\y')"  // Word boundary match for short queries
          : "to_tsvector('english', f.answer) @@ plainto_tsquery('english', $1) OR f.question ILIKE $2 OR f.keywords ILIKE $2 OR f.answer ILIKE $2"
        }
      )
      ORDER BY relevance DESC, f.view_count DESC
      LIMIT 10
    `
    
    const params = isShortQuery ? [searchQuery] : [searchQuery, `%${searchQuery}%`]
    const result = await db.query(query, params)
    
    // Process dynamic content for all results
    for (const faq of result.rows) {
      faq.answer = await this.processDynamicAnswer(faq.answer)
    }
    
    return result.rows
  }

  /**
   * Increment FAQ view count
   */
  static async incrementViewCount(faqId) {
    const query = `
      UPDATE faqs 
      SET view_count = view_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `
    const result = await db.query(query, [faqId])
    return result
  }

  /**
   * Update FAQ feedback (helpful/not helpful)
   */
  static async updateFAQFeedback(faqId, isHelpful) {
    const field = isHelpful ? 'helpful_count' : 'not_helpful_count'
    const query = `
      UPDATE faqs 
      SET ${field} = ${field} + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `
    const result = await db.query(query, [faqId])
    return result
  }

  // ============================================
  // LOOKUP TABLE QUERIES (for dynamic FAQ responses)
  // ============================================

  /**
   * Get all document types from catalog
   */
  static async getDocumentTypes() {
    const query = `
      SELECT 
        id,
        title,
        description,
        fee,
        filename
      FROM document_catalog
      WHERE is_active = 1
      ORDER BY title ASC
    `
    const result = await db.query(query)
    return result.rows
  }

  /**
   * Get special categories
   */
  static async getSpecialCategories() {
    const query = `
      SELECT 
        id,
        category_code,
        category_name,
        description
      FROM special_categories
      ORDER BY category_name ASC
    `
    const result = await db.query(query)
    return result.rows
  }

  // ============================================
  // CHAT CONVERSATIONS
  // ============================================

  /**
   * Create new chat conversation
   */
  static async createConversation(userId, sessionId) {
    const query = `
      INSERT INTO chat_conversations (user_id, session_id, started_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *
    `
    const result = await db.query(query, [userId, sessionId])
    return result.rows[0]
  }

  /**
   * Get conversation by session ID
   */
  static async getConversationBySession(sessionId) {
    const query = `
      SELECT * FROM chat_conversations
      WHERE session_id = $1 AND is_active = 1
      ORDER BY started_at DESC
      LIMIT 1
    `
    const result = await db.query(query, [sessionId])
    return result.rows.length > 0 ? result.rows[0] : null
  }

  /**
   * End conversation
   */
  static async endConversation(conversationId) {
    const query = `
      UPDATE chat_conversations
      SET ended_at = CURRENT_TIMESTAMP,
          is_active = 0
      WHERE id = $1
    `
    const result = await db.query(query, [conversationId])
    return result
  }

  // ============================================
  // CHAT MESSAGES
  // ============================================

  /**
   * Save chat message
   */
  static async saveMessage(conversationId, messageType, messageText, faqId = null) {
    const query = `
      INSERT INTO chat_messages (conversation_id, message_type, message_text, faq_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const result = await db.query(query, [conversationId, messageType, messageText, faqId])
    return result.rows[0]
  }

  /**
   * Get conversation messages
   */
  static async getConversationMessages(conversationId, limit = 50) {
    const query = `
      SELECT 
        id,
        message_type,
        message_text,
        faq_id,
        was_helpful,
        created_at
      FROM chat_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      LIMIT $2
    `
    const result = await db.query(query, [conversationId, limit])
    return result.rows
  }

  /**
   * Update message feedback
   */
  static async updateMessageFeedback(messageId, wasHelpful) {
    const query = `
      UPDATE chat_messages
      SET was_helpful = $1
      WHERE id = $2
    `
    const result = await db.query(query, [wasHelpful ? 1 : 0, messageId])
    return result
  }

  // ============================================
  // ADMIN MANAGEMENT (Future)
  // ============================================

  /**
   * Create new FAQ (admin only)
   */
  static async createFAQ(categoryId, question, answer, keywords, createdBy) {
    const query = `
      INSERT INTO faqs (category_id, question, answer, keywords, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await db.query(query, [categoryId, question, answer, keywords, createdBy])
    return result.rows[0]
  }

  /**
   * Update FAQ (admin only)
   */
  static async updateFAQ(faqId, categoryId, question, answer, keywords) {
    const query = `
      UPDATE faqs
      SET category_id = $1,
          question = $2,
          answer = $3,
          keywords = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `
    const result = await db.query(query, [categoryId, question, answer, keywords, faqId])
    return result.rows[0]
  }

  /**
   * Delete FAQ (admin only) - soft delete
   */
  static async deleteFAQ(faqId) {
    const query = `
      UPDATE faqs
      SET is_active = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `
    const result = await db.query(query, [faqId])
    return result
  }
}

module.exports = ChatbotRepository
