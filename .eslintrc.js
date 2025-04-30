module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    // 允许 console 语句，因为这是桌面应用
    'no-console': 'off',
    // 允许在回调函数中使用箭头函数
    'prefer-arrow-callback': 'off',
    // 允许函数参数重新赋值，在 Electron 中有时需要
    'no-param-reassign': 'off',
    // 允许使用 ++/-- 运算符
    'no-plusplus': 'off',
    // 允许在 then/catch 中返回值
    'no-return-await': 'off',
    // 允许在 catch 语句中使用 continue
    'no-continue': 'off',
    // 允许使用 new 关键字
    'no-new': 'off',
    // 允许函数内部声明函数
    'no-inner-declarations': 'off',
    // 允许在 if 语句中进行赋值
    'no-cond-assign': ['error', 'except-parens'],
    // 强制使用单引号
    quotes: ['error', 'single'],
    // 允许在对象属性中使用下划线
    'no-underscore-dangle': 'off',
    // 允许在条件语句中使用常量表达式
    'no-constant-condition': ['error', { checkLoops: false }],
    // 允许多个空行
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    // 允许在定义前使用变量或函数
    'no-use-before-define': 'off',
    // 允许使用匿名函数
    'func-names': 'off',
    // 要求或禁止末尾逗号
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    }],
    // 允许 electron 在 devDependencies 中
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: true,
      optionalDependencies: false,
      peerDependencies: false,
      bundledDependencies: false,
    }],
  },
  globals: {
    // 定义全局变量
    window: true,
    document: true,
    require: true,
    process: true,
    __dirname: true,
  },
};
