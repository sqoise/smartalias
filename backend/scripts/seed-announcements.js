const db = require('../config/db')
const logger = require('../config/logger')
const { ANNOUNCEMENT_TYPES } = require('../config/constants')

const sampleAnnouncements = [
  {
    title: 'Community Clean-Up Drive',
    content: 'Join us this Saturday for our monthly community clean-up drive. Let\'s work together to keep our barangay clean and green. Bring your gloves and cleaning materials!',
    type: ANNOUNCEMENT_TYPES.ACTIVITIES,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-08-15T08:00:00Z')
  },
  {
    title: 'Free Health Check-Up',
    content: 'The barangay health center is offering free health check-ups and vaccinations for all residents this Friday from 8 AM to 5 PM. Bring your health card and valid ID.',
    type: ANNOUNCEMENT_TYPES.HEALTH,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-07-22T09:00:00Z')
  },
  {
    title: 'Water Interruption Advisory',
    content: 'Water supply will be temporarily interrupted tomorrow from 9 AM to 3 PM for emergency pipe repairs. Please store enough water for your needs.',
    type: ANNOUNCEMENT_TYPES.ADVISORY,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-10-03T15:00:00Z')
  },
  {
    title: 'Christmas Celebration Planning Meeting',
    content: 'All residents are invited to attend the Christmas celebration planning meeting on December 15th at the barangay hall. Your ideas and participation are welcome!',
    type: ANNOUNCEMENT_TYPES.ACTIVITIES,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-09-28T10:00:00Z')
  },
  {
    title: 'Basketball Tournament Registration',
    content: 'Basketball tournament registration is now open! Teams must register by December 20th. Maximum of 12 players per team. Contact the barangay sports coordinator.',
    type: ANNOUNCEMENT_TYPES.ACTIVITIES,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-09-15T11:00:00Z')
  },
  {
    title: 'Senior Citizens Cash Assistance Program',
    content: 'Senior citizens are reminded to claim their quarterly cash assistance at the barangay hall. Bring your senior citizen ID and barangay clearance.',
    type: ANNOUNCEMENT_TYPES.ASSISTANCE,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-08-05T13:00:00Z')
  },
  {
    title: 'Typhoon Preparedness Advisory',
    content: 'A typhoon is expected to affect our area this weekend. Please secure your properties and prepare emergency kits. Evacuation center is ready at the barangay hall.',
    type: ANNOUNCEMENT_TYPES.ADVISORY,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-10-01T07:00:00Z')
  },
  {
    title: 'Barangay Assembly Meeting',
    content: 'Quarterly barangay assembly meeting will be held on December 18th at 2 PM. All household representatives are required to attend. Important matters will be discussed.',
    type: ANNOUNCEMENT_TYPES.GENERAL,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-09-10T14:00:00Z')
  },
  {
    title: 'Job Fair Announcement',
    content: 'A job fair will be held at the barangay covered court on December 22nd. Various companies will be accepting applications. Bring your resume and valid IDs.',
    type: ANNOUNCEMENT_TYPES.ACTIVITIES,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-09-05T10:00:00Z')
  },
  {
    title: 'Garbage Collection Schedule Update',
    content: 'New garbage collection schedule: Biodegradable waste on Mondays and Thursdays, Non-biodegradable on Tuesdays and Fridays. Recyclables on Saturdays.',
    type: ANNOUNCEMENT_TYPES.GENERAL,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-07-10T08:00:00Z')
  },
  {
    title: 'Free Skills Training Workshop',
    content: 'Free cooking and baking workshop for interested residents. Limited slots available. Register at the barangay hall until December 16th. Materials provided.',
    type: ANNOUNCEMENT_TYPES.ACTIVITIES,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-06-25T09:30:00Z')
  },
  {
    title: 'Road Closure Advisory',
    content: 'Main road will be closed for repairs from December 14-16. Use alternate routes via Purok 3 and Purok 5. Heavy vehicles are not allowed.',
    type: ANNOUNCEMENT_TYPES.ADVISORY,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-09-20T16:00:00Z')
  },
  {
    title: 'Youth Development Program',
    content: 'Calling all youth ages 15-21! Join our youth development program featuring leadership training, sports activities, and educational workshops. Registration ongoing.',
    type: ANNOUNCEMENT_TYPES.ACTIVITIES,
    created_by: 1,
    published_by: 1,
    published_at: new Date('2025-08-30T11:00:00Z')
  },
  {
    title: 'Tax Declaration Reminder',
    content: 'Reminder to all property owners: Real property tax declarations are due by December 31st. Visit the municipal treasury office for payment.',
    type: ANNOUNCEMENT_TYPES.GENERAL,
    created_by: 1,
    published_by: null,
    published_at: null // Draft
  },
  {
    title: 'New Year Celebration Guidelines',
    content: 'Guidelines for New Year celebration: No firecrackers allowed. Community fireworks display will be held at the barangay plaza. Let\'s celebrate safely!',
    type: ANNOUNCEMENT_TYPES.ACTIVITIES,
    created_by: 1,
    published_by: null,
    published_at: null // Draft
  }
]

async function seedAnnouncements() {
  try {
    logger.info('Starting announcement seeding...')
    
    // Connect to database
    await db.connect()
    
    if (db.getType() !== 'postgres') {
      logger.error('This script requires PostgreSQL database connection')
      process.exit(1)
    }

    const client = db.getClient()
    await client.query('BEGIN')

    // Check if user with ID 1 exists, if not create a seed admin user
    const userCheck = await client.query('SELECT id FROM users WHERE id = 1')
    
    if (userCheck.rows.length === 0) {
      logger.info('Creating seed admin user with ID 1...')
      await client.query(`
        INSERT INTO users (id, username, password, role, is_password_changed, created_at)
        VALUES (1, 'seed.admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVcj/YRZvzi', 1, 1, NOW())
        ON CONFLICT (id) DO NOTHING
      `)
      logger.info('Seed admin user created successfully')
    } else {
      logger.info('User with ID 1 already exists, using existing user')
    }

    // Clear existing announcements
    await client.query('DELETE FROM announcements')
    logger.info('Cleared existing announcements')

    // Insert sample announcements
    const insertQuery = `
      INSERT INTO announcements (
        title, content, type, is_active, created_by, published_by, published_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, title, type, published_at
    `

    let publishedCount = 0
    let draftCount = 0

    for (const announcement of sampleAnnouncements) {
      const values = [
        announcement.title,
        announcement.content,
        announcement.type,
        1, // is_active
        announcement.created_by,
        announcement.published_by,
        announcement.published_at
      ]
      
      const result = await client.query(insertQuery, values)
      const inserted = result.rows[0]
      
      if (inserted.published_at) {
        publishedCount++
        logger.info(`✓ Inserted published announcement: ${inserted.title} (ID: ${inserted.id})`)
      } else {
        draftCount++
        logger.info(`✓ Inserted draft announcement: ${inserted.title} (ID: ${inserted.id})`)
      }
    }

    await client.query('COMMIT')
    
    logger.info('='.repeat(60))
    logger.info(`Successfully seeded ${sampleAnnouncements.length} announcements`)
    logger.info(`  - Published: ${publishedCount}`)
    logger.info(`  - Drafts: ${draftCount}`)
    logger.info(`Type Distribution:`)
    logger.info(`  - General: ${sampleAnnouncements.filter(a => a.type === ANNOUNCEMENT_TYPES.GENERAL).length}`)
    logger.info(`  - Health: ${sampleAnnouncements.filter(a => a.type === ANNOUNCEMENT_TYPES.HEALTH).length}`)
    logger.info(`  - Activities: ${sampleAnnouncements.filter(a => a.type === ANNOUNCEMENT_TYPES.ACTIVITIES).length}`)
    logger.info(`  - Assistance: ${sampleAnnouncements.filter(a => a.type === ANNOUNCEMENT_TYPES.ASSISTANCE).length}`)
    logger.info(`  - Advisory: ${sampleAnnouncements.filter(a => a.type === ANNOUNCEMENT_TYPES.ADVISORY).length}`)
    logger.info('='.repeat(60))
    
    await db.disconnect()
    process.exit(0)
  } catch (error) {
    logger.error('Error seeding announcements:', error)
    await db.disconnect()
    process.exit(1)
  }
}

// Run seeding
seedAnnouncements()
