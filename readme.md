# Sequelize Enc

Allows specifying [Joi](https://github.com/hapijs/joi) validation schema for `JSONB` model attributes in [Sequelize](https://github.com/sequelize/sequelize).

### Installation

```
npm install --save sequelize-enc
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
