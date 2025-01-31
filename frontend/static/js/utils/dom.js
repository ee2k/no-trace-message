// Simple DOM selector utilities
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

// Add $ method to Element prototype
Element.prototype.$ = function(selector) {
  return this.querySelector(selector);
};

// Add $$ method to Element prototype
Element.prototype.$$ = function(selector) {
  return [...this.querySelectorAll(selector)]; // Convert NodeList to Array
};

export { $, $$ };