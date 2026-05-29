import type { FlashMessage } from '@tyrantware/shared'

export const flash = $state<{ item: FlashMessage | null }>({ item: null })

export const setFlash = (item: FlashMessage | null) => {
  flash.item = item
}
