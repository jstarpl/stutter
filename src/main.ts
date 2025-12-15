import './style.css'

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')!

const BAR_COLOR = '#ffffff'

// State
let lastTimestamp = 0
const history: { timestamp: number; duration: number }[] = []
const HISTORY_DURATION = 5000 // 5 seconds

// Resize handling
function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
window.addEventListener('resize', resize)
resize()

// Animation Loop
function loop(timestamp: number) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp
    requestAnimationFrame(loop)
    return
  }

  const frameDuration = timestamp - lastTimestamp
  lastTimestamp = timestamp

  // Update history
  history.push({ timestamp, duration: frameDuration })
  
  // Remove old history
  while (history.length > 0 && history[0].timestamp < timestamp - HISTORY_DURATION) {
    history.shift()
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 1. Sweeping Rectangle
  // Speed: 1 screen width per 2 seconds (arbitrary, just needs to be fast enough to see)
  const speed = canvas.width / 2000 // pixels per ms
  const rectWidth = 200
  const rectX = (timestamp * speed) % (canvas.width + rectWidth) - rectWidth

  const quadCanvasHeight = canvas.height / 4
  
  ctx.fillStyle = `rgba(255, 255, 255, 1)`
  ctx.fillRect(rectX, 0, rectWidth, quadCanvasHeight)

  ctx.fillStyle = `rgba(255, 255, 255, 0.5)`
  ctx.fillRect(rectX, 1 * quadCanvasHeight, rectWidth, canvas.height / 4)

  ctx.fillStyle = `rgba(255, 255, 255, 0.25)`
  ctx.fillRect(rectX, 2 * quadCanvasHeight, rectWidth, canvas.height / 4)

  ctx.fillStyle = `rgba(255, 255, 255, 0)`
  ctx.fillRect(rectX, 3 * quadCanvasHeight, rectWidth, canvas.height / 4)

  // 2. Performance Graph
  drawGraph(timestamp)

  requestAnimationFrame(loop)
}

let maxFrameTime = 60 // ms

function drawGraph(currentTimestamp: number) {
  const graphX = 10
  const graphY = 10
  const graphWidth = 300
  const graphHeight = 100
  
  // Background for graph
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(graphX, graphY, graphWidth, graphHeight)

  // Draw bars
  ctx.beginPath()
  ctx.strokeStyle = '#00ff00'
  ctx.lineWidth = 1

  // We map 5 seconds to graphWidth
  // We map 0-33ms (approx 30fps) to graphHeight. 16.6ms is middle.
  
  let worstFrameTime = 0 // ms

  for (const entry of history) {
    const timeAgo = currentTimestamp - entry.timestamp
    const x = graphX + graphWidth - (timeAgo / HISTORY_DURATION) * graphWidth
    
    // Height: 0 at bottom, maxFrameTime at top
    const height = Math.min(entry.duration / maxFrameTime, 1) * graphHeight
    const y = graphY + graphHeight - height

    ctx.moveTo(x, graphY + graphHeight)
    ctx.lineTo(x, y)

    if (entry.duration > worstFrameTime) {
      worstFrameTime = entry.duration
    }
  }

  maxFrameTime = worstFrameTime * 3

  ctx.stroke()

  // Text info
  ctx.fillStyle = '#ffffff'
  ctx.font = '12px monospace'
  const currentFrameTime = history[history.length - 1]?.duration.toFixed(2) || '0.00'
  ctx.fillText(`Frame: ${currentFrameTime}ms`, graphX + 5, graphY + 15)
  ctx.fillText(`Worst (in 5s window): ${worstFrameTime.toFixed(2)}ms`, graphX + 5, graphY + 30)
}

requestAnimationFrame(loop)
