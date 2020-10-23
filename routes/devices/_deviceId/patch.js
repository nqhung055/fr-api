import knex from '@api/database.js'
import { BadRequestError } from '@helpers/errors'

export default async (req, res) => {
  const { deviceId } = req.params
  const { names } = req.query
  const { displayName} = req.body

  validateParams({ deviceId, names })
  const arrNames = names.split(",")

  const devices = await knex('devices').where('id', deviceId).whereIn('name', arrNames).select('id')
  const lstDeviceId = devices.map(device => device.id)
  await knex('devices').whereIn('id', lstDeviceId).update({ display_name: displayName, active: 1, created_date: knex.fn.now(),  updated_date: knex.fn.now() })

  return res.success("OK")
}

function validateParams({ deviceId, names }) {
  if (!deviceId) throw new BadRequestError("userId not valid")
  if (!names) throw new BadRequestError("devices in query not valid")

  const arrNames = names.split(',')
  if (!arrNames.length) throw new BadRequestError("Cannot convert names to array")
}
