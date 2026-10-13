export default defineEventHandler(async () => {
  const db = await checkDatabaseConnection(1000)
  return {
    status: db.connected ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: db.connected,
      isOffline: db.isOffline,
      message: db.message,
      config: db.config
    }
  }
})
