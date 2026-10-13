import { defineEventHandler } from 'h3'
import { checkDatabaseConnection } from '../../utils/db'

export default defineEventHandler(async () => {
  return await checkDatabaseConnection()
})
