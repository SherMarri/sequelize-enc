'use strict'

// TODO: REAL, DECIMAL, TIME, DATE, DATEONLY, HSTORE, NOW, BLOB, RANGE, ENUM, ARRAY, GEOMETRY, GEOGRAPHY

module.exports.encode = (type, value) => {
  let buffer
  switch (type.key) {

    case 'INTEGER':
    case 'BIGINT':
      buffer = Buffer.alloc(6)
      buffer.writeIntBE(value, 0, 6)
      return buffer

    case 'DOUBLE':
      buffer = Buffer.alloc(8)
      buffer.writeDoubleBE(value, 0)
      return buffer

    case 'FLOAT':
      buffer = Buffer.alloc(4)
      buffer.writeFloatBE(value, 0)
      return buffer

    case 'STRING':
    case 'CHAR':
    case 'TEXT':
    case 'UUID':
    case 'UUIDV1':
    case 'UUIDV4':
      return Buffer.from(value, 'utf-8')

    case 'BOOLEAN':
      const num = value ? 1 : 0
      return Buffer.from([ num ])

    case 'JSON':
    case 'JSONB':
      try {
        value = JSON.stringify(value)
        JSON.parse(value)
        return Buffer.from(value, 'utf-8')
      } catch (e) {
        throw new Error(`Invalid ${type.key} value`)
      }

    default:
      throw new Error(`Unsupported type: ${type.key}`)
  }
}

module.exports.decode = (type, bytes) => {
  switch (type.key) {

    case 'INTEGER':
    case 'BIGINT':
      return bytes.readIntBE(0, 6)

    case 'DOUBLE':
      return bytes.readDoubleBE()

    case 'FLOAT':
      return bytes.readFloatBE()

    case 'STRING':
    case 'CHAR':
    case 'TEXT':
    case 'UUID':
    case 'UUIDV1':
    case 'UUIDV4':
      return bytes.toString('utf-8')

    case 'BOOLEAN':
      const num = bytes.readUInt8()
      return num === 1

    case 'JSON':
    case 'JSONB':
      return JSON.parse(bytes.toString('utf-8'))

    default:
      throw new Error(`Unsupported type: ${type.key}`)
  }
}
