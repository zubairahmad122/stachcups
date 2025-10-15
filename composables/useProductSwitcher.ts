import { useProductStore } from '~/store/product'
import { useEditorStore } from '~/store/editor'
import { useCanvasOperations } from './useCanvasOperations'

export function useProductSwitcher() {
  const productStore = useProductStore()
  const editorStore = useEditorStore()
  const canvasOps = useCanvasOperations()

  /**
   * Switch to a new product and scale design elements appropriately
   */
  const switchProduct = async (type: string, size: string) => {
    try {
      // Get scale factors before switching
      const oldProduct = { ...productStore.currentProduct }

      // Switch product (updates dimensions)
      const success = productStore.switchProduct(type, size)
      if (!success) {
        return { success: false, error: 'Product not found' }
      }

      // Calculate scale factors
      const scaleX = productStore.currentProduct.width / oldProduct.width
      const scaleY = productStore.currentProduct.height / oldProduct.height

      // Scale all elements to fit new print area
      scaleAllElements(scaleX, scaleY)

      // Update canvas dimensions
      canvasOps.updateCanvasDimensions({
        width: productStore.currentProduct.width,
        height: productStore.currentProduct.height,
      })

      // Update cup texture with new dimensions
      await canvasOps.updateCupTexture()

      return {
        success: true,
        scaleX,
        scaleY,
        product: productStore.currentProduct,
      }
    } catch (error) {
      console.error('Failed to switch product:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Scale all design elements by given factors
   */
  const scaleAllElements = (scaleX: number, scaleY: number) => {
    editorStore.elements.forEach((element) => {
      // Scale position
      if (element.position) {
        element.position.x *= scaleX
        element.position.y *= scaleY
      }

      // Scale element size (for images and text)
      if (element.scale) {
        // Apply uniform scale to maintain aspect ratio
        const avgScale = (scaleX + scaleY) / 2
        element.scale *= avgScale
      }

      // Scale font size for text elements
      if ((element.type === 'text' || element.type === 'monogram') && element.fontSize) {
        const avgScale = (scaleX + scaleY) / 2
        element.fontSize = Math.round(element.fontSize * avgScale)
      }

      // Update element in store
      editorStore.updateElement(element.id, element)
    })
  }

  /**
   * Get available products for switching
   */
  const getAvailableProducts = () => {
    return [
      { type: 'bandit', label: 'Bandit', sizes: ['16oz', '23oz', '32oz'] },
      { type: 'general', label: 'General', sizes: ['16oz', '24oz', '32oz'] },
      { type: 'magnum', label: 'Magnum', sizes: ['16oz', '23oz', '32oz'] },
      { type: 'handlebar', label: 'Handlebar', sizes: ['18oz'] },
      { type: 'walrus', label: 'Walrus', sizes: ['24oz'] },
      { type: 'imperial', label: 'Imperial', sizes: ['12oz'] },
      { type: 'lil stache', label: 'Lil Stache', sizes: ['10oz'] },
      { type: 'hudson', label: 'Hudson', sizes: ['40oz'] },
    ]
  }

  /**
   * Check if current design fits in new product
   */
  const checkDesignFit = (newWidth: number, newHeight: number): boolean => {
    const currentWidth = productStore.currentProduct.width
    const currentHeight = productStore.currentProduct.height

    // Check if new product is smaller
    if (newWidth < currentWidth || newHeight < currentHeight) {
      return false
    }

    return true
  }

  return {
    switchProduct,
    scaleAllElements,
    getAvailableProducts,
    checkDesignFit,
  }
}
