# Sequelize Enc

Support for encrypted attributes for [Sequelize](https://github.com/sequelize/sequelize) models.

This is an extended version of sequelize-enc with two additional hooks:
```js
sequelize.addHook('afterCreate', decryptAttributes)
sequelize.addHook('afterUpdate', decryptAttributes)
```

### Installation

```
npm install --save sequelize-enc-extended
```

### Usage

```js
const Sequelize = require('sequelize')
const sequelizeEncPlugin = require('sequelize-enc')

const sequelize = new Sequelize()

sequelizeEncPlugin(sequelize, {
  encrypt: value => {
    return value
  },
  decrypt: value => {
    return value
  },
})
```

### Example

```js
const SampleModel = sequelize.define('SampleModel', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  details: {
    type: Sequelize.BLOB,
    encrypted: {
      type: Sequelize.JSONB,
    },
  },
})

await SampleModel.create({
  name: 'Sample name',
  details: {
    password: 'qwerty',
    secret: 'azerty',
  },
})
```
