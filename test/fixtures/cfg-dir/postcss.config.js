import postcssImport from 'postcss-import'
export default function () {
  return {
    plugins: [postcssImport()],
  }
}
