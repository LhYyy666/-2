const cloudbase = require('@cloudbase/node-sdk')
const app = cloudbase.init({ env: process.env.TCB_ENV || 'cloud1-2gyakmjl948dda68' })
const db = app.database()

async function handleImport(list) {
  const col = db.collection('device_serials')
  const snList = list.map(x => String(x.SN || '').trim()).filter(Boolean)
  const cemiList = list.map(x => String(x.CEMI || '').trim()).filter(Boolean)
  const existingBySN = snList.length ? (await col.where({ SN: db.command.in(snList) }).get()).data : []
  const existingByCEMI = cemiList.length ? (await col.where({ CEMI: db.command.in(cemiList) }).get()).data : []
  const seenSN = new Set(existingBySN.map(x => x.SN))
  const seenCEMI = new Set(existingByCEMI.map(x => x.CEMI))
  const now = Date.now()
  const toInsert = []
  for (const it of list) {
    const SN = String(it.SN || '').trim()
    const CEMI = String(it.CEMI || '').trim()
    if (!SN && !CEMI) continue
    if ((SN && seenSN.has(SN)) || (CEMI && seenCEMI.has(CEMI))) continue
    toInsert.push({
      SN,
      CEMI,
      deviceName: String(it.deviceName || '').trim(),
      deviceModel: String(it.deviceModel || '').trim(),
      inboundTime: String(it.inboundTime || '').trim(),
      status: String(it.status || '未使用').trim(),
      createdAt: now,
      updatedAt: now
    })
  }
  let inserted = 0
  for (const doc of toInsert) {
    await col.add(doc)
    inserted++
  }
  return { inserted, duplicated: list.length - inserted }
}

async function handleList({ page = 1, pageSize = 10, keyword }) {
  const skip = (page - 1) * pageSize
  let query = db.collection('device_serials')
  if (keyword) {
    const reg = db.RegExp({ regexp: keyword, options: 'i' })
    query = query.where({
      $or: [
        { SN: reg },
        { CEMI: reg },
        { deviceName: reg },
        { deviceModel: reg }
      ]
    })
  }
  const countRes = await query.count()
  const res = await query.orderBy('createdAt', 'desc').skip(skip).limit(pageSize).get()
  return { list: res.data, total: countRes.total, page, pageSize }
}

function parseBody(b) {
  if (!b) return {}
  if (typeof b === 'string') {
    try { return JSON.parse(b) } catch { return {} }
  }
  return b
}

// 适配 HTTP 访问服务（云函数 URL 化）：event 风格
exports.main = async (event) => {
  try {
    const body = parseBody(event?.body)
    const type = body?.type || event?.type
    const list = body?.list || event?.list || []
    if (type === 'import-device-serials' || type === 'importDeviceSerials' || type === '导入设备序列') {
      if (!Array.isArray(list) || list.length === 0) {
        return { code: 400, msg: 'empty list' }
      }
      const data = await handleImport(list)
      return { code: 0, data }
    }
    if (type === 'list-device-serials' || type === 'listDeviceSerials' || type === '设备串码列表') {
      const data = await handleList(body)
      return { code: 0, data }
    }
    return { code: 400, msg: `Unknown type: ${type}` }
  } catch (e) {
    return { code: 500, msg: e.message || 'server error' }
  }
}

// 适配云托管/Express 风格：req/res
module.exports = async (req, res) => {
  try {
    const body = parseBody(req?.body)
    const { type, list = [] } = body
    if (type === 'import-device-serials' || type === 'importDeviceSerials' || type === '导入设备序列') {
      if (!Array.isArray(list) || list.length === 0) {
        res.status(400).json({ code: 400, msg: 'empty list' })
        return
      }
      const data = await handleImport(list)
      res.json({ code: 0, data })
      return
    }
    if (type === 'list-device-serials' || type === 'listDeviceSerials' || type === '设备串码列表') {
      const data = await handleList(body)
      res.json({ code: 0, data })
      return
    }
    res.status(400).json({ code: 400, msg: `Unknown type: ${type}` })
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message || 'server error' })
  }
}
