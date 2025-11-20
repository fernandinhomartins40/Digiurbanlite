declare module 'jscanify/src/jscanify' {
  export default class JScanify {
    constructor()
    highlightPaper(image: any): any
    findPaperContour(image: any): any
    getCornerPoints(contour: any): {
      topLeftCorner: { x: number; y: number }
      topRightCorner: { x: number; y: number }
      bottomRightCorner: { x: number; y: number }
      bottomLeftCorner: { x: number; y: number }
    }
    extractPaper(image: any, width: number, height: number): HTMLCanvasElement
  }
}
