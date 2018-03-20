'use strict'

const debug = require('debug')('sequelize-enc')
const { encode, decode } = require('./bytes')

module.exports = function (sequelize, { encrypt, decrypt }, logger = console) {

  if (!sequelize) {
    throw new Error('The required sequelize instance option is missing')
  }

  async function encryptAttributes(instances) {

    if (!instances) {
      return
    }

    if (instances.constructor !== Array) {
      instances = [ instances ]
    }

    await Promise.all(instances.map(instance => {

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

      return Promise.all(changedKeys.map(async fieldName => {

        const fieldDefinition = instance.rawAttributes[fieldName]

        // If no such attribute (virtual field), or no encryption needed
        if (!fieldDefinition || !fieldDefinition.encrypted) {
          return
        }

        const type = new fieldDefinition.encrypted.type
        const value = instance.get(fieldName)

        // Validate value
        type.validate(value)

        let bytes

        try {
          // Encode value into bytes
          bytes = encode(type, value)
        } catch (e) {
          logger.error(e)
          throw e
        }

        // Encrypt bytes
        const encrypted = await encrypt(bytes)

        instance.set(fieldName, encrypted)
      }))
    }))
  }

  async function decryptAttributes(instances) {

    if (!instances) {
      return
    }

    if (instances.constructor !== Array) {
      instances = [ instances ]
    }

    await Promise.all(instances.map(instance => {

      const attributeKeys = Object.keys(instance.rawAttributes)

      return Promise.all(attributeKeys.map(async fieldName => {

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

        let bytes
        
        try {
          // Decrypt bytes
          bytes = await decrypt(encrypted)
        } catch (e) {
          logger.error(e)
          throw e
        }

        // Decode value from bytes
        const value = decode(type, bytes)

        instance.set(fieldName, value)
      }))
    }))
  }

  sequelize.addHook('beforeCreate', encryptAttributes)
  sequelize.addHook('beforeUpdate', encryptAttributes)
  sequelize.addHook('afterFind', decryptAttributes)
}
