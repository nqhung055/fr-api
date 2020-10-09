import knex from '@api/database'
import { status, residentPrefix } from '@constants/user'

export default async (req, res) => {
    const { deviceIds, endDate } = req.query

    let condition = 'WHERE `rank`=1'
    if (deviceIds.length) condition = condition + ` AND sn IN (${deviceIds.split(',').map(id => "'" + id + "'").join(",")})`
    if (endDate) condition = condition + ` AND updatedAt > '${endDate} 00:00:00' AND updatedAt < '${endDate} 23:59:59'`

    const totalResidentsCondition = `
        AND userId NOT LIKE '${residentPrefix}%';
    `
    const presentPeoplesCondition = `
        AND status='${status.inside}'
    `
    const presentResidentsCondition = `
        AND userId NOT LIKE '${residentPrefix}%' 
        AND status='${status.inside}'
    `
    const presentGuestsCondition = `
        AND userId LIKE '${residentPrefix}%' 
        AND status='${status.inside}'
    `

    const [[totalResidents]] = await knex.raw(getUniqQuery('totalResidents') + condition + totalResidentsCondition)
    const [[presentPeoples]] = await knex.raw(getUniqQuery('presentPeoples') + condition + presentPeoplesCondition)
    const [[presentResidents]] = await knex.raw(getUniqQuery('presentResidents') + condition + presentResidentsCondition)
    const [[presentGuests]] = await knex.raw(getUniqQuery('presentGuests') + condition + presentGuestsCondition)

    return res.success({ ...totalResidents, ...presentPeoples, ...presentResidents, ...presentGuests })
}

function getUniqQuery(column) {
    return `
        WITH user_sort_by_time AS (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY userId ORDER BY updatedAt DESC) AS 'rank'
            FROM users AS user
        )
        SELECT COUNT(*) as ${column}
        FROM user_sort_by_time
    `
}