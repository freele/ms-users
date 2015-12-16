const ld = require('lodash');
const moment = require('moment');
const setMetadata = require('../utils/updateMetadata.js');

/**
 * Adds metadata from billing into usermix
 * @param  {String} username
 * @return {Promise}
 */
module.exports = function mixPlan(username, audience) {
  const { amqp, config } = this;
  const { payments } = config;
  const route = [payments.prefix, payments.routes.planGet].join('.');
  const id = 'free';

  return amqp
    .publishAndWait(route, id, { timeout: 5000 })
    .bind(this)
    .then(function mix(plan) {
      const subscription = ld.findWhere(plan.subscriptions, { name: id });
      const nextCycle = moment().add(1, 'month').format();
      const update = {
        username: username,
        audience: audience,
        '$set': {
          plan: id,
          nextCycle,
          models: subscription.models,
          modelPrice: subscription.price,
        },
      };

      return setMetadata.call(this, update);
    });
};