/**
 * Chatbot Repository
 * Handles database operations for FAQ system and chat conversations
 */

const db = require('../config/db')
const logger = require('../config/logger')

class ChatbotRepository {
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
   * Get all active FAQs (optionally filtered by category)
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
        f.display_order
      FROM faqs f
      JOIN faq_categories c ON f.category_id = c.id
      WHERE f.is_active = 1
    `
    const params = []

    if (categoryId) {
      query += ` AND f.category_id = $1`
      params.push(categoryId)
    }

    query += ` ORDER BY f.display_order ASC, f.id ASC`

    const result = await db.query(query, params)
    return result.rows
  }

  /**
   * Get FAQ by ID
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
    return result.rows.length > 0 ? result.rows[0] : null
  }

  /**
   * Search FAQs by query string
   * Uses full-text search on question, answer, and keywords
   */
  static async searchFAQs(searchQuery) {
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
        to_tsvector('english', f.answer) @@ plainto_tsquery('english', $1) OR
        f.question ILIKE $2 OR
        f.keywords ILIKE $2 OR
        f.answer ILIKE $2
      )
      ORDER BY relevance DESC, f.view_count DESC
      LIMIT 10
    `
    const likePattern = `%${searchQuery}%`
    const result = await db.query(query, [searchQuery, likePattern])
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
