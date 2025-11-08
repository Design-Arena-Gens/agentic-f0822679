import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const canvasRef = useRef(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedP1, setSelectedP1] = useState(null)
  const [selectedP2, setSelectedP2] = useState(null)

  useEffect(() => {
    if (!gameStarted || !selectedP1 || !selectedP2) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = 1200
    canvas.height = 600

    const fighters = {
      naruto: {
        name: 'Наруто',
        color: '#ff6600',
        secondaryColor: '#ffaa00',
        special: 'Расенган',
        ultimate: 'Клоны'
      },
      sasuke: {
        name: 'Саске',
        color: '#0033cc',
        secondaryColor: '#6666ff',
        special: 'Чидори',
        ultimate: 'Аматерасу'
      },
      sakura: {
        name: 'Сакура',
        color: '#ff66cc',
        secondaryColor: '#ffccff',
        special: 'Удар Силы',
        ultimate: 'Лечение'
      }
    }

    class Fighter {
      constructor(x, fighter, facingRight, controls) {
        this.x = x
        this.y = 400
        this.width = 60
        this.height = 100
        this.velocityY = 0
        this.velocityX = 0
        this.gravity = 0.8
        this.jumpPower = -15
        this.speed = 5
        this.hp = 100
        this.chakra = 100
        this.facingRight = facingRight
        this.fighter = fighters[fighter]
        this.state = 'idle'
        this.attackCooldown = 0
        this.specialCooldown = 0
        this.ultimateCooldown = 0
        this.blockTime = 0
        this.controls = controls
        this.projectiles = []
        this.clones = []
        this.healingEffect = 0
        this.invincible = 0
      }

      draw() {
        ctx.save()

        // Draw shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.beginPath()
        ctx.ellipse(this.x + this.width/2, 500, this.width/2, 10, 0, 0, Math.PI * 2)
        ctx.fill()

        // Draw fighter body
        ctx.fillStyle = this.fighter.color
        if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0) {
          ctx.globalAlpha = 0.5
        }

        // Body
        ctx.fillRect(this.x + 15, this.y + 30, 30, 40)

        // Head
        ctx.fillStyle = '#ffcc99'
        ctx.beginPath()
        ctx.arc(this.x + 30, this.y + 20, 15, 0, Math.PI * 2)
        ctx.fill()

        // Hair
        ctx.fillStyle = this.fighter === fighters.sakura ? '#ff99cc' : '#333'
        ctx.fillRect(this.x + 20, this.y + 5, 20, 15)

        // Eyes
        ctx.fillStyle = '#000'
        if (this.facingRight) {
          ctx.fillRect(this.x + 25, this.y + 18, 3, 3)
          ctx.fillRect(this.x + 32, this.y + 18, 3, 3)
        } else {
          ctx.fillRect(this.x + 25, this.y + 18, 3, 3)
          ctx.fillRect(this.x + 32, this.y + 18, 3, 3)
        }

        // Arms
        ctx.fillStyle = this.fighter.color
        ctx.fillRect(this.x + 10, this.y + 35, 10, 25)
        ctx.fillRect(this.x + 40, this.y + 35, 10, 25)

        // Legs
        ctx.fillRect(this.x + 18, this.y + 70, 10, 30)
        ctx.fillRect(this.x + 32, this.y + 70, 10, 30)

        // Attack animation
        if (this.state === 'attack') {
          ctx.fillStyle = this.fighter.secondaryColor
          ctx.beginPath()
          if (this.facingRight) {
            ctx.arc(this.x + 60, this.y + 40, 15, 0, Math.PI * 2)
          } else {
            ctx.arc(this.x, this.y + 40, 15, 0, Math.PI * 2)
          }
          ctx.fill()
        }

        // Special indicator
        if (this.state === 'special') {
          ctx.fillStyle = this.fighter.secondaryColor
          ctx.globalAlpha = 0.7
          for (let i = 0; i < 5; i++) {
            ctx.beginPath()
            ctx.arc(this.x + 30, this.y + 50, 30 + i * 10, 0, Math.PI * 2)
            ctx.stroke()
          }
        }

        // Healing effect
        if (this.healingEffect > 0) {
          ctx.strokeStyle = '#00ff00'
          ctx.lineWidth = 3
          for (let i = 0; i < 3; i++) {
            ctx.beginPath()
            ctx.arc(this.x + 30, this.y + 50, 20 + i * 15 + this.healingEffect, 0, Math.PI * 2)
            ctx.stroke()
          }
        }

        ctx.restore()

        // Draw projectiles
        this.projectiles.forEach(proj => {
          ctx.fillStyle = proj.color
          ctx.beginPath()
          ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2)
          ctx.fill()

          // Trail effect
          ctx.globalAlpha = 0.5
          ctx.beginPath()
          ctx.arc(proj.x - proj.velocityX * 2, proj.y, proj.size * 0.7, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        })

        // Draw clones
        this.clones.forEach(clone => {
          ctx.globalAlpha = 0.6
          ctx.fillStyle = this.fighter.color
          ctx.fillRect(clone.x + 15, clone.y + 30, 30, 40)
          ctx.fillStyle = '#ffcc99'
          ctx.beginPath()
          ctx.arc(clone.x + 30, clone.y + 20, 15, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        })
      }

      update(keys, opponent) {
        // State management
        if (this.attackCooldown > 0) this.attackCooldown--
        if (this.specialCooldown > 0) this.specialCooldown--
        if (this.ultimateCooldown > 0) this.ultimateCooldown--
        if (this.blockTime > 0) this.blockTime--
        if (this.healingEffect > 0) {
          this.healingEffect--
          if (this.healingEffect % 10 === 0) {
            this.hp = Math.min(100, this.hp + 1)
          }
        }
        if (this.invincible > 0) this.invincible--

        // Reset state
        if (this.attackCooldown === 0 && this.specialCooldown === 0 && this.blockTime === 0) {
          this.state = 'idle'
        }

        // Movement
        this.velocityX = 0
        if (keys[this.controls.left] && this.x > 0) {
          this.velocityX = -this.speed
          this.facingRight = false
        }
        if (keys[this.controls.right] && this.x < 1200 - this.width) {
          this.velocityX = this.speed
          this.facingRight = true
        }
        if (keys[this.controls.jump] && this.y >= 400) {
          this.velocityY = this.jumpPower
        }

        // Block
        if (keys[this.controls.block]) {
          this.blockTime = 5
        }

        // Attack
        if (keys[this.controls.attack] && this.attackCooldown === 0) {
          this.state = 'attack'
          this.attackCooldown = 30
          const distance = Math.abs(this.x - opponent.x)
          if (distance < 80 && opponent.blockTime === 0 && opponent.invincible === 0) {
            opponent.hp -= 5
            opponent.velocityX = this.facingRight ? 10 : -10
          }
        }

        // Special technique
        if (keys[this.controls.special] && this.specialCooldown === 0 && this.chakra >= 30) {
          this.state = 'special'
          this.specialCooldown = 60
          this.chakra -= 30

          if (this.fighter === fighters.naruto) {
            // Rasengan projectile
            this.projectiles.push({
              x: this.x + (this.facingRight ? this.width : 0),
              y: this.y + 40,
              velocityX: this.facingRight ? 8 : -8,
              velocityY: 0,
              size: 20,
              color: '#00aaff',
              damage: 15
            })
          } else if (this.fighter === fighters.sasuke) {
            // Chidori projectile
            this.projectiles.push({
              x: this.x + (this.facingRight ? this.width : 0),
              y: this.y + 40,
              velocityX: this.facingRight ? 12 : -12,
              velocityY: 0,
              size: 15,
              color: '#ffffff',
              damage: 20
            })
          } else if (this.fighter === fighters.sakura) {
            // Power punch
            const distance = Math.abs(this.x - opponent.x)
            if (distance < 100 && opponent.blockTime === 0 && opponent.invincible === 0) {
              opponent.hp -= 25
              opponent.velocityX = this.facingRight ? 15 : -15
              opponent.velocityY = -10
            }
          }
        }

        // Ultimate technique
        if (keys[this.controls.ultimate] && this.ultimateCooldown === 0 && this.chakra >= 50) {
          this.ultimateCooldown = 180
          this.chakra -= 50

          if (this.fighter === fighters.naruto) {
            // Shadow clones
            for (let i = 0; i < 3; i++) {
              this.clones.push({
                x: this.x + (i - 1) * 80,
                y: this.y,
                life: 60
              })
            }
          } else if (this.fighter === fighters.sasuke) {
            // Amaterasu
            if (opponent.invincible === 0) {
              opponent.hp -= 30
              opponent.invincible = 60
            }
          } else if (this.fighter === fighters.sakura) {
            // Healing
            this.healingEffect = 100
            this.hp = Math.min(100, this.hp + 30)
          }
        }

        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
          proj.x += proj.velocityX
          proj.y += proj.velocityY

          const hitOpponent = Math.abs(proj.x - opponent.x - opponent.width/2) < 30 &&
                              Math.abs(proj.y - opponent.y - 50) < 50

          if (hitOpponent && opponent.blockTime === 0 && opponent.invincible === 0) {
            opponent.hp -= proj.damage
            opponent.velocityX = proj.velocityX > 0 ? 8 : -8
            return false
          }

          return proj.x > -50 && proj.x < 1250
        })

        // Update clones
        this.clones = this.clones.filter(clone => {
          clone.life--
          return clone.life > 0
        })

        // Apply physics
        this.x += this.velocityX
        this.y += this.velocityY
        this.velocityY += this.gravity

        // Ground collision
        if (this.y >= 400) {
          this.y = 400
          this.velocityY = 0
        }

        // Chakra regeneration
        if (this.chakra < 100) {
          this.chakra += 0.1
        }

        // Bounds
        this.x = Math.max(0, Math.min(1200 - this.width, this.x))
      }
    }

    const player1 = new Fighter(100, selectedP1, true, {
      left: 'a',
      right: 'd',
      jump: 'w',
      attack: 'f',
      special: 'g',
      ultimate: 'h',
      block: 's'
    })

    const player2 = new Fighter(1000, selectedP2, false, {
      left: 'ArrowLeft',
      right: 'ArrowRight',
      jump: 'ArrowUp',
      attack: 'k',
      special: 'l',
      ultimate: ';',
      block: 'ArrowDown'
    })

    const keys = {}
    window.addEventListener('keydown', (e) => keys[e.key] = true)
    window.addEventListener('keyup', (e) => keys[e.key] = false)

    let gameOver = false

    function gameLoop() {
      ctx.fillStyle = '#87ceeb'
      ctx.fillRect(0, 0, 1200, 600)

      // Ground
      ctx.fillStyle = '#8b7355'
      ctx.fillRect(0, 500, 1200, 100)
      ctx.fillStyle = '#6b5d4f'
      for (let i = 0; i < 1200; i += 100) {
        ctx.fillRect(i, 500, 90, 5)
      }

      // Trees
      for (let i = 0; i < 4; i++) {
        const x = i * 300 + 50
        ctx.fillStyle = '#654321'
        ctx.fillRect(x, 350, 20, 150)
        ctx.fillStyle = '#228b22'
        ctx.beginPath()
        ctx.arc(x + 10, 340, 40, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!gameOver) {
        player1.update(keys, player2)
        player2.update(keys, player1)

        if (player1.hp <= 0 || player2.hp <= 0) {
          gameOver = true
        }
      }

      player1.draw()
      player2.draw()

      // UI
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(20, 20, 550, 80)
      ctx.fillRect(630, 20, 550, 80)

      // Player 1 UI
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 20px Arial'
      ctx.fillText(player1.fighter.name, 40, 45)

      ctx.fillStyle = '#333'
      ctx.fillRect(40, 55, 500, 20)
      ctx.fillStyle = player1.hp > 30 ? '#00ff00' : '#ff0000'
      ctx.fillRect(40, 55, (player1.hp / 100) * 500, 20)

      ctx.fillStyle = '#333'
      ctx.fillRect(40, 80, 200, 10)
      ctx.fillStyle = '#00aaff'
      ctx.fillRect(40, 80, (player1.chakra / 100) * 200, 10)

      // Player 2 UI
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'right'
      ctx.fillText(player2.fighter.name, 1160, 45)

      ctx.fillStyle = '#333'
      ctx.fillRect(660, 55, 500, 20)
      ctx.fillStyle = player2.hp > 30 ? '#00ff00' : '#ff0000'
      ctx.fillRect(660, 55, (player2.hp / 100) * 500, 20)

      ctx.fillStyle = '#333'
      ctx.fillRect(960, 80, 200, 10)
      ctx.fillStyle = '#00aaff'
      ctx.fillRect(960, 80, (player2.chakra / 100) * 200, 10)

      ctx.textAlign = 'left'

      // Game Over
      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'
        ctx.fillRect(0, 0, 1200, 600)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 60px Arial'
        ctx.textAlign = 'center'
        const winner = player1.hp > 0 ? player1.fighter.name : player2.fighter.name
        ctx.fillText(winner + ' Победил!', 600, 300)
        ctx.font = '30px Arial'
        ctx.fillText('Обновите страницу для новой игры', 600, 360)
      }

      requestAnimationFrame(gameLoop)
    }

    gameLoop()
  }, [gameStarted, selectedP1, selectedP2])

  if (!gameStarted) {
    return (
      <>
        <Head>
          <title>Наруто Файтинг</title>
        </Head>
        <div style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '50px', textShadow: '3px 3px 6px rgba(0,0,0,0.5)' }}>
            ⚡ НАРУТО ФАЙТИНГ ⚡
          </h1>

          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '20px' }}>Игрок 1</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['naruto', 'sasuke', 'sakura'].map(fighter => (
                <button
                  key={fighter}
                  onClick={() => setSelectedP1(fighter)}
                  style={{
                    padding: '20px 40px',
                    fontSize: '24px',
                    background: selectedP1 === fighter ? '#ffd700' : 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transform: selectedP1 === fighter ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}
                >
                  {fighter === 'naruto' ? '🍥 Наруто' : fighter === 'sasuke' ? '⚡ Саске' : '🌸 Сакура'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '20px' }}>Игрок 2</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['naruto', 'sasuke', 'sakura'].map(fighter => (
                <button
                  key={fighter}
                  onClick={() => setSelectedP2(fighter)}
                  style={{
                    padding: '20px 40px',
                    fontSize: '24px',
                    background: selectedP2 === fighter ? '#ffd700' : 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transform: selectedP2 === fighter ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}
                >
                  {fighter === 'naruto' ? '🍥 Наруто' : fighter === 'sasuke' ? '⚡ Саске' : '🌸 Сакура'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => selectedP1 && selectedP2 && setGameStarted(true)}
            disabled={!selectedP1 || !selectedP2}
            style={{
              padding: '20px 60px',
              fontSize: '32px',
              background: selectedP1 && selectedP2 ? '#ff6600' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: selectedP1 && selectedP2 ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
              marginTop: '20px'
            }}
          >
            НАЧАТЬ БОЙ!
          </button>

          <div style={{ marginTop: '50px', background: 'rgba(0,0,0,0.5)', padding: '30px', borderRadius: '15px', maxWidth: '800px' }}>
            <h3 style={{ marginBottom: '15px' }}>Управление:</h3>
            <div style={{ display: 'flex', gap: '50px', justifyContent: 'center' }}>
              <div>
                <h4>Игрок 1:</h4>
                <p>A/D - движение</p>
                <p>W - прыжок</p>
                <p>S - блок</p>
                <p>F - атака</p>
                <p>G - спец. техника</p>
                <p>H - ультимейт</p>
              </div>
              <div>
                <h4>Игрок 2:</h4>
                <p>←/→ - движение</p>
                <p>↑ - прыжок</p>
                <p>↓ - блок</p>
                <p>K - атака</p>
                <p>L - спец. техника</p>
                <p>; - ультимейт</p>
              </div>
            </div>
            <div style={{ marginTop: '20px', fontSize: '14px', opacity: '0.8' }}>
              <p><strong>Наруто:</strong> Расенган (проектайл), Клоны (множественные атаки)</p>
              <p><strong>Саске:</strong> Чидори (быстрый проектайл), Аматерасу (большой урон)</p>
              <p><strong>Сакура:</strong> Удар Силы (мощная атака), Лечение (восстановление HP)</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Наруто Файтинг - Бой</title>
      </Head>
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000'
      }}>
        <canvas ref={canvasRef} style={{ border: '3px solid #fff' }} />
      </div>
    </>
  )
}
