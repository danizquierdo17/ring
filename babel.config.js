module.exports = function (api) {
  const isTest = api.env('test');
  api.cache.using(() => isTest);
  return {
    presets: ['babel-preset-expo'],
    // nativewind/babel injects runtime imports that crash in the node jest env.
    // Skip it entirely during tests — domain/data code has no className props.
    plugins: isTest ? [] : ['nativewind/babel'],
  };
};
