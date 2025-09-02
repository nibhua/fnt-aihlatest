"use client"

import { useRef, useEffect, useState } from "react"

export default function AdobeDisplay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const isTouchingRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth / 2
      canvas.height = window.innerHeight
      setIsMobile(window.innerWidth < 768)
    }
    updateCanvasSize()

    let particles: {
      x: number
      y: number
      baseX: number
      baseY: number
      size: number
      color: string
      scatteredColor: string
      angle: number
      radius: number
      isHeader: boolean
    }[] = []

    let textImageData: ImageData | null = null
    let headerImageData: ImageData | null = null

    function createTextImage() {
      if (!ctx || !canvas) return 0
      ctx.save()

      const mainSize = isMobile ? 100 : 170
      const taglineSize = mainSize * 0.5
      const headerSize = mainSize * 0.4
      const lineGap = 28

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2 - mainSize * 0.7

      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Header: Supercharged by ⚡ (pinkish orange)
      ctx.font = `700 ${headerSize}px Arial`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = "#a81f00ff"
      ctx.shadowColor = "#44ff00ff"
      ctx.shadowBlur = 40
      ctx.fillText(`Supercharged by ⚡`, centerX, centerY)

      // Capture header image data
      headerImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      ctx.shadowBlur = 0
      ctx.fillStyle = "#000000"

      // Adobe
      ctx.font = `bold ${mainSize}px Arial`
      ctx.fillText("Adobe", centerX, centerY + headerSize + lineGap + mainSize * 0.25)

      // Creativity for All
      ctx.font = `bold ${taglineSize}px Arial`
      ctx.fillText("Creativity for All", centerX, centerY + headerSize + lineGap + mainSize * 1.1)

      ctx.restore()

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return 1
    }

    function createParticle(scale: number) {
      if (!ctx || !canvas || !textImageData || !headerImageData) return null
      const textData = textImageData.data
      const headerData = headerImageData.data

      for (let attempt = 0; attempt < 40; attempt++) {
        const x = Math.floor(Math.random() * canvas.width)
        const y = Math.floor(Math.random() * canvas.height)
        const pixelIndex = (y * canvas.width + x) * 4 + 3
        
        if (textData[pixelIndex] > 128) {
          // Check if this pixel is part of the header text
          const isHeader = headerData[pixelIndex] > 128
          
          return {
            x,
            y,
            baseX: x,
            baseY: y,
            size: Math.random() * 1.3 + 0.7,
            color: isHeader ? "#ED2224" : "#111111",
            scatteredColor: isHeader ? "#ff0000ff" : "#E53935",
            angle: Math.random() * Math.PI * 2,
            radius: Math.random() * 1.5 + 0.8, // subtle wiggle inside bounds
            isHeader: isHeader
          }
        }
      }
      return null
    }

    function createInitialParticles(scale: number) {
      if (!canvas) return
      const baseParticleCount = 42000 // Increased from 12000 for denser particles
      const particleCount = Math.floor(
        baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080))
      )
      for (let i = 0; i < particleCount; i++) {
        const p = createParticle(scale)
        if (p) particles.push(p)
      }
    }

    let animationFrameId: number
    function animate(scale: number) {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const { x: mouseX, y: mouseY } = mousePositionRef.current
      const maxDistance = 150

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance && (isTouchingRef.current || !("ontouchstart" in window))) {
          // scatter outward
          const force = (maxDistance - distance) / maxDistance
          const angle = Math.atan2(dy, dx)
          const moveX = Math.cos(angle) * force * 22
          const moveY = Math.sin(angle) * force * 22
          p.x = p.baseX - moveX
          p.y = p.baseY - moveY
          ctx.fillStyle = p.scatteredColor
          ctx.shadowColor = p.isHeader ? "#FF6B4A80" : "#FF000080"
          ctx.shadowBlur = 6
        } else {
          // alive but subtle drifting around base
          p.angle += 0.02
          p.x = p.baseX + Math.cos(p.angle) * p.radius
          p.y = p.baseY + Math.sin(p.angle) * p.radius
          ctx.fillStyle = p.color
          ctx.shadowBlur = 0
        }

        ctx.fillRect(p.x, p.y, p.size, p.size)
      }

      animationFrameId = requestAnimationFrame(() => animate(scale))
    }

    const scale = createTextImage()
    createInitialParticles(scale)
    animate(scale)

    const handleResize = () => {
      updateCanvasSize()
      const newScale = createTextImage()
      particles = []
      createInitialParticles(newScale)
    }

    const handleMove = (x: number, y: number) => {
      const adjustedX = x - window.innerWidth / 2
      mousePositionRef.current = { x: adjustedX, y }
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("mousemove", (e) => handleMove(e.clientX, e.clientY))
    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length > 0) {
          e.preventDefault()
          handleMove(e.touches[0].clientX, e.touches[0].clientY)
        }
      },
      { passive: false }
    )
    window.addEventListener("touchstart", () => {
      isTouchingRef.current = true
    })
    window.addEventListener("touchend", () => {
      isTouchingRef.current = false
    })

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isMobile])

  return (
    <div className="w-full h-full absolute top-0 left-0 flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute top-0 left-0 touch-none"
        aria-label="Interactive Adobe particle text"
      />
      {/* Static tagline */}
      <p className="absolute bottom-12 text-gray-600 text-lg font-light text-center px-4">
        Discover insights and connections to navigate documents like never before.
      </p>
    </div>
  )
}
