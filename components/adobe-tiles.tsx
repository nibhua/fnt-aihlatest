"use client"

import { useEffect, useRef, useState } from "react"

export default function AdobeTiles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()

    const tileSize = 12
    const cols = Math.ceil(canvas.offsetWidth / tileSize)
    const rows = Math.ceil(canvas.offsetHeight / tileSize)

    const getAdobePattern = (cols: number, rows: number) => {
      const centerX = Math.floor(cols / 2)
      const centerY = Math.floor(rows / 2)
      const logoTiles = new Set<string>()

      // Adobe "A" symbol - more precise triangular shape
      const aHeight = 12
      const aWidth = 10

      // Create the triangular A shape
      for (let row = 0; row < aHeight; row++) {
        const y = centerY - 15 + row
        const widthAtRow = Math.floor((row * aWidth) / aHeight)

        // Left edge of triangle
        const leftX = centerX - widthAtRow
        logoTiles.add(`${leftX},${y}`)

        // Right edge of triangle
        const rightX = centerX + widthAtRow
        if (rightX !== leftX) {
          logoTiles.add(`${rightX},${y}`)
        }

        // Horizontal crossbar (around 60% down the triangle)
        if (row === Math.floor(aHeight * 0.6)) {
          for (let x = leftX; x <= rightX; x++) {
            logoTiles.add(`${x},${y}`)
          }
        }
      }

      // "Adobe" text - cleaner letter formation
      const textStartY = centerY + 2

      // Letter A
      const letterA = [
        [0, 1, 2, 3, 4], // top
        [0, 4], // sides row 1
        [0, 1, 2, 3, 4], // middle bar
        [0, 4], // sides row 2
        [0, 4], // bottom
      ]

      // Letter d
      const letterd = [
        [1, 2, 3, 4], // top
        [0, 4], // sides
        [0, 4], // sides
        [0, 4], // sides
        [1, 2, 3, 4], // bottom
      ]

      // Letter o
      const lettero = [
        [1, 2, 3], // top
        [0, 3], // sides
        [0, 3], // sides
        [0, 3], // sides
        [1, 2, 3], // bottom
      ]

      // Letter b
      const letterb = [
        [0, 1, 2, 3], // top
        [0, 3], // sides
        [0, 1, 2], // middle
        [0, 3], // sides
        [0, 1, 2, 3], // bottom
      ]

      // Letter e
      const lettere = [
        [0, 1, 2, 3], // top
        [0], // left side
        [0, 1, 2], // middle
        [0], // left side
        [0, 1, 2, 3], // bottom
      ]

      const letters = [letterA, letterd, lettero, letterb, lettere]
      const letterSpacing = 7

      letters.forEach((letter, letterIndex) => {
        const letterStartX = centerX - 18 + letterIndex * letterSpacing
        letter.forEach((row, rowIndex) => {
          row.forEach((col) => {
            logoTiles.add(`${letterStartX + col},${textStartY + rowIndex}`)
          })
        })
      })

      return logoTiles
    }

    const adobePattern = getAdobePattern(cols, rows)

    const tiles: Array<{
      x: number
      y: number
      opacity: number
      isLogo: boolean
      baseOpacity: number
    }> = []

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const isLogo = adobePattern.has(`${i},${j}`)
        const baseOpacity = isLogo ? 0.9 : Math.random() * 0.2 + 0.05
        tiles.push({
          x: i * tileSize,
          y: j * tileSize,
          opacity: baseOpacity,
          isLogo,
          baseOpacity,
        })
      }
    }

    const drawTiles = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      tiles.forEach((tile) => {
        const isHovered =
          hoveredTile &&
          Math.floor(hoveredTile.x / tileSize) === Math.floor(tile.x / tileSize) &&
          Math.floor(hoveredTile.y / tileSize) === Math.floor(tile.y / tileSize)

        const opacity = isHovered ? Math.min(tile.opacity + 0.4, 1) : tile.opacity
        ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`
        ctx.fillRect(tile.x, tile.y, tileSize - 1, tileSize - 1)
      })
    }

    drawTiles()

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setHoveredTile({ x, y })
    }

    const handleMouseLeave = () => {
      setHoveredTile(null)
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    const handleResize = () => {
      resizeCanvas()
      drawTiles()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [hoveredTile])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ width: "100%", height: "100%" }} />
    </div>
  )
}
