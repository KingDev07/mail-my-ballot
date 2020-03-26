import { useHistory, useLocation, matchPath } from "react-router-dom"

const allPathEnums = [
  'start',
  'address',
  'state',
  'success',
] as const
export type PathEnum = (typeof allPathEnums)[number]

interface PathBase {
  type: PathEnum
}

export interface StartPath extends PathBase {
  type: 'start'
}
export interface AddressPath extends PathBase {
  type: 'address'
  state: string
  zip?: string
}
export interface StatePath extends PathBase {
  type: 'state'
  state: string
}
export interface SuccessPath extends PathBase {
  type: 'success'
  id?: string
}

export type Path = (
  | StartPath
  | AddressPath
  | StatePath
  | SuccessPath
)

interface PathDatum<P extends Path = Path> {
  path: string
  toUrl: (path: P) => string
  scrollId: string
}

type ByEnum<E extends PathEnum, P> = P extends {type: E} ? P : never
type PathByEnum<E extends PathEnum> = ByEnum<E, Path>
type PathData = { [E in PathEnum]: PathDatum<PathByEnum<E>> }

export const pathData: PathData = {
  'start': {
    path: '/',
    toUrl: (_) => '/',
    scrollId: 'start',
  },
  'address': {
    path: '/address/:state/:zip?',
    toUrl: ({state, zip}) => `/address/${state}/${zip || ''}`,
    scrollId: 'address'
  },
  'state': {
    path: '/state/:state',
    toUrl: ({state}) => `/state/${state}`,
    scrollId: 'address',
  },
  'success': {
    path: '/success/:id?',
    toUrl: ({id}) => `/success/${id || ''}`,
    scrollId: 'address',
  }
}

export const toUrl = <P extends Path>(path: P): string => {
  // arg -- can't get around this typecast
  return (pathData[path.type] as PathDatum<P>).toUrl(path)
}

const rawToPath = <P extends Path>(url: string, pathEnum: PathEnum, exact = false): P | null => {
  const { path } = pathData[pathEnum]
  const match = matchPath<P>(url, { path, exact })
  if (!match) return null
  return { type: pathEnum, ...match.params }
}

export const toPath = (pathname: string): Path | null => {
  const matches = allPathEnums.map(e => rawToPath<StartPath>(pathname, e, true))
  return matches.reduce((x, y) => x || y, null)
}

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

export const useAppHistory = () => {
  const history = useHistory()
  const { pathname, search } = useLocation()
  const _query = new URLSearchParams(search)
  
  const pushScroll = (path: Path) => {
    history.push(toUrl(path))
    scrollToId(pathData[path.type].scrollId)
  }

  return {
    path: toPath(pathname),
    pushStart: () => pushScroll({type: 'start'}),
    pushAddress: (state: string, zip?: string) => {
      pushScroll({type: 'address', state, zip})
    },
    pushStateForm: (state: string) => {
      pushScroll({type: 'state', state})
    },
    pushSuccess: (id: string) => {
      pushScroll({type: 'success', id})
    },
    query: (id: string) => {
      return _query.get(id)
    }
  }
}
