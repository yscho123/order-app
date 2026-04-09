import menuAmericanoIce from '../assets/menu-americano-ice.png'
import menuAmericanoHot from '../assets/menu-americano-hot.png'
import menuCafeLatte from '../assets/menu-cafe-latte.png'

const MAP = {
  'americano-ice': menuAmericanoIce,
  'americano-hot': menuAmericanoHot,
  'cafe-latte': menuCafeLatte,
}

/** @param {readonly { id: string }[]} menus */
export function attachMenuImages(menus) {
  return menus.map((m) => ({
    ...m,
    image: MAP[m.id] ?? null,
  }))
}
