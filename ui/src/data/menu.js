import menuAmericanoIce from '../assets/menu-americano-ice.png'
import menuAmericanoHot from '../assets/menu-americano-hot.png'
import menuCafeLatte from '../assets/menu-cafe-latte.png'

/** @typedef {{ id: string, name: string, extraPrice: number }} MenuOption */
/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   price: number,
 *   description: string,
 *   image: string,
 *   options: MenuOption[],
 * }} MenuItem
 */

/** @type {MenuItem[]} */
export const MENU_ITEMS = [
  {
    id: 'americano-ice',
    name: '아메리카노(ICE)',
    price: 4000,
    description: '간단한 설명…',
    image: menuAmericanoIce,
    options: [
      { id: 'shot', name: '샷 추가', extraPrice: 500 },
      { id: 'syrup', name: '시럽 추가', extraPrice: 0 },
    ],
  },
  {
    id: 'americano-hot',
    name: '아메리카노(HOT)',
    price: 4000,
    description: '간단한 설명…',
    image: menuAmericanoHot,
    options: [
      { id: 'shot', name: '샷 추가', extraPrice: 500 },
      { id: 'syrup', name: '시럽 추가', extraPrice: 0 },
    ],
  },
  {
    id: 'cafe-latte',
    name: '카페라떼',
    price: 5000,
    description: '간단한 설명…',
    image: menuCafeLatte,
    options: [
      { id: 'shot', name: '샷 추가', extraPrice: 500 },
      { id: 'syrup', name: '시럽 추가', extraPrice: 0 },
    ],
  },
]

/** @param {string} id @returns {MenuItem | undefined} */
export function getMenuItemById(id) {
  return MENU_ITEMS.find((item) => item.id === id)
}
