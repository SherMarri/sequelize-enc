'use strict'

const debug = require('debug')('sequelize-enc')
const bytes = require('./bytes')

module.exports = function (sequelize, { encrypt, decrypt }) {

  if (!sequelize) {
    throw new Error('The required sequelize instance option is missing')
  }

  async function encryptAttributes(instance) {

    const changedKeys = []

    Object.keys(instance._changed).forEach(fieldName => {
      if (instance._changed[fieldName]) {
        changedKeys.push(fieldName)
      }
    })

    if (!changedKeys.length) {
      return
    }

    debug(`Changed attributes: ${changedKeys}`)

    await Promise.all(changedKeys.map(async fieldName => {

      const fieldDefinition = instance.rawAttributes[fieldName]

      // If no such attribute (virtual field), or no encryption needed
      if (!fieldDefinition || !fieldDefinition.encrypted) {
        return
      }

      const type = new fieldDefinition.encrypted.type
      const value = instance.get(fieldName)

      // Validate value
      type.validate(value)

      // Encode value into bytes
      const bytes = bytes.encode(type, value)

      // Encrypt bytes
      const encrypted = await encrypt(bytes)

      instance.set(fieldName, encrypted)
    }))
  }

  async function decryptAttributes(instance) {

    const attributeKeys = Object.keys(instance.rawAttributes)

    await Promise.all(attributeKeys.map(async fieldName => {

      const fieldDefinition = instance.rawAttributes[fieldName]

      // If no such attribute (virtual field), or no encryption needed
      if (!fieldDefinition || !fieldDefinition.encrypted) {
        return
      }

      const type = new fieldDefinition.encrypted.type
      const encrypted = instance.get(fieldName)

      if (!encrypted) {
        return null
      }

      // Decrypt bytes
      const bytes = await decrypt(encrypted)

      // Decode value from bytes
      const value = bytes.decode(type, bytes)

      instance.set(fieldName, value)
    }))
  }

  sequelize.addHook('beforeCreate', encryptAttributes)
  sequelize.addHook('beforeUpdate', encryptAttributes)
  sequelize.addHook('afterFind', decryptAttributes)
}
