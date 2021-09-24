import test from 'ava'
import getMapfile from './getMapfile.js'

test('mapFile path is properly resolved', async (t) => {
  const paths = [
    {
      input: { to: '/foo/bar.css/baz/index.css' },
      want: '/foo/bar.css/baz/index.css.map',
    },
    {
      input: { to: '/foo/bar.sss/baz/index.sss' },
      want: '/foo/bar.sss/baz/index.sss.map',
    },
    {
      input: { to: '/foo/bar.css/baz/bar.css' },
      want: '/foo/bar.css/baz/bar.css.map',
    },
    {
      input: { map: { annotation: 'foo.map' }, to: '/foo/bar.css/baz/bar.css' },
      want: '/foo/bar.css/baz/foo.map',
    },
  ]

  for (const p of paths) {
    t.is(getMapfile(p.input), p.want)
  }
})
