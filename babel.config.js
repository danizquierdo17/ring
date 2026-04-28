module.exports = function (api) {
  api.cache(true);
  const isTest = api.env('test');
  return {
    presets: ['babel-preset-expo'],
    // nativewind/babel injects runtime imports that crash in the node jest env.
    // Skip it entirely during tests — domain/data code has no className props.
    plugins: isTest ? [] : ['nativewind/babel'],
  };
};
