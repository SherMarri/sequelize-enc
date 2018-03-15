'use strict'

const debug = require('debug')('sequelize-enc')
const { encode, decode } = require('./bytes')

module.exports = function (sequelize, { encrypt, decrypt }) {

  if (!sequelize) {
    throw new Error('The required sequelize instance option is missing')
  }

  async function encryptAttributes(instances) {

    if (!instance) {
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

        // Encode value into bytes
        const bytes = encode(type, value)

        // Encrypt bytes
        const encrypted = await encrypt(bytes)

        instance.set(fieldName, encrypted)
      }))
    }))
  }

  async function decryptAttributes(instances) {

    if (!instance) {
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

        // Decrypt bytes
        const bytes = await decrypt(encrypted)

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
