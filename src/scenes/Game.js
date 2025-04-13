import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
        this.playerLives = 1;
        this.shieldStrength = 100;
    }
    
    init() {
        console.log('Game.js: init() called!'); // Confirm init() is running
        this.playerLives = 1; // Reset lives
        this.shieldStrength = 100; // Reset shield
        this.starArray = []; // Reset star array
    }
  
  create() {
    console.log('Game.js: create() called!'); // Debugging to confirm create is running
    
    // Proper cleanup of enemies or groups from previous session
    if (this.enemies) {
      console.log('Clearing existing enemies group...');
      this.enemies.clear(true, true); // Fully clear group if restarting
    }
    
    // Reinitialize the enemies group
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true,
    });
    
    // Clear and reinitialize bullets group
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      runChildUpdate: true,
    });
    
    // Clear and reinitialize enemy bullets group
    this.enemyBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      runChildUpdate: true,
    });
    
    // Create a star field
    this.stars = this.add.graphics();
    
    // Create 100 random stars
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, this.sys.game.config.width); // Random x position
      const y = Phaser.Math.Between(0, this.sys.game.config.height); // Random y position
      const size = Phaser.Math.Between(2, 4); // Random star size
      
      this.starArray.push({ x, y, size }); // Add to the star array
    }
    
    this.livesText = this.add.text(10, 40, `Lives: ${this.playerLives}`, {
      fontSize: '20px',
      fill: '#ffffff',
    });
    
    // Add the shield strength UI
    this.shieldText = this.add.text(10, 70, `Shield: ${this.shieldStrength}%`, {
      fontSize: '20px',
      fill: '#ffffff',
    });
    
    // Add the player to the scene
    this.player = this.physics.add.sprite(400, 700, 'player');
    this.player.body.immovable = true; // Prevent the player from being pushed by other objects
    
    this.player.setCollideWorldBounds(true); // Prevent the player from leaving bounds
    
    // Update collider to handle player hits with shield logic
    this.physics.add.collider(this.player, this.enemyBullets, this.handlePlayerHit, null, this);
    
    // Setup keyboard input
    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Create enemies for the game
    this.createEnemies(); // Ensure this works with the new `this.enemies` group
    this.addEnemyShootingBehavior();
    
    // Add collision logic for the player and bullets
    this.physics.add.collider(this.player, this.enemyBullets, this.handlePlayerHit, null, this);
    this.physics.add.collider(this.bullets, this.enemies, this.handleBulletHit, null, this);
    
    // Add score
    this.score = 0;
    
    this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, {
      fontSize: '20px',
      fill: '#ffffff',
    });
    
    // Debug to verify the enemies group is properly initialized
    console.log('Enemies group after setup:', this.enemies.getChildren());
  }
    
    update() {
        // Player movement
        if (this.cursorKeys.left.isDown || this.keys.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursorKeys.right.isDown || this.keys.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        // Shooting bullets
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const bullet = this.bullets.create(this.player.x, this.player.y - 50, 'bullet');
            bullet.setVelocityY(-400); // Bullet moves upward
            // Play the shooting sound effect
            this.game.shootSound.play()
            
        }
        
        // Starfield background
        this.stars.clear(); // Clear previous frame
        this.stars.fillStyle(0xffffff); // White star color
        
        this.starArray.forEach(star => {
            star.y += 2; // Move the star down (adjust speed as needed)
            
            // Wrap the star to the top when it leaves the screen
            if (star.y > this.sys.game.config.height) {
                star.y = 0;
                star.x = Phaser.Math.Between(0, this.sys.game.config.width);
            }
            
            // Draw the star
            this.stars.fillCircle(star.x, star.y, star.size);
        });
        
        // Check for lose condition: if any enemy has reached the bottom
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.y > this.sys.game.config.height - 100) {
                this.gameOver(); // Call the game over logic
            }
        });
        
    }
    
    createEnemies() {
      if (this.enemies) {
        this.enemies.clear(true, true); // Remove all game objects and children in the group
      }
      
      this.enemies = this.physics.add.group({
          classType: Phaser.Physics.Arcade.Sprite,
          runChildUpdate: true,
          allowGravity: true,
        }); // Group for enemies
        
        const rows = 5; // Number of rows
        const cols = 11; // Number of columns
        
        const enemyWidth = 93 * 0.5; // Scaled width of enemy sprite
        const enemyHeight = 84 * 0.5; // Scaled height of enemy sprite
        const totalGridWidth = cols * enemyWidth; // Total width of the grid
        const spacing = 15; // Spacing between enemies
        
        const offsetX = (this.sys.game.config.width - totalGridWidth) / 2;
        
        const startY = 50; // Starting Y position
        
        // Create the grid of enemies
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = offsetX + col * (enemyWidth + spacing); // Calculate x position dynamically
                const y = startY + row * (enemyHeight + spacing); // Calculate y position for rows
                const enemy = this.enemies.create(x, y, 'enemy');
                if (!enemy || !enemy.body) {
                  console.error('Enemy failed to create properly:', enemy);
                  continue;
                }
                enemy.row = row;
                enemy.column = col;
                // Scale the enemy
                enemy.setScale(0.5);
            }
        }
        
        this.enemyDirection = 1; // 1: move right, -1: move left
        
        // Schedule enemy movement
        this.time.addEvent({
            delay: 500, // Time between steps in ms (0.5 seconds = 500ms)
            callback: this.updateEnemies,
            callbackScope: this, // Ensure `this` points to the Scene
            loop: true, // Continuously run this event
        });
        
    }
    
    handleBulletHit(bullet, enemy) {
        bullet.destroy(); // Remove the bullet
        enemy.destroy(true); // Remove the enemy
        this.game.explodeSound.play();
        
        // Update and display the score
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
    }
    
    updateEnemies() {
        // Calculate the outermost enemies' positions (group boundaries)
        let leftMost = Infinity;
        let rightMost = -Infinity;
        
        this.enemies.children.iterate((enemy) => {
            if (enemy.active) { // Only consider active enemies
                leftMost = Math.min(leftMost, enemy.x);
                rightMost = Math.max(rightMost, enemy.x);
            }
        });
        
        // Reverse direction and move down if the group hits the screen edges
        const buffer = 20; // Padding for the edges
        if (leftMost < buffer || rightMost > this.sys.game.config.width - buffer) {
            this.enemyDirection *= -1; // Reverse horizontal direction
            this.enemies.children.iterate((enemy) => {
                enemy.y += 50; // Move the group downward
            });
        }
        
        // Move all enemies horizontally based on the group direction
        this.enemies.children.iterate((enemy) => {
            if (enemy.active) {
                enemy.x += this.enemyDirection * 15; // Adjust step size as needed
            }
        });
    }
    
    addEnemyShootingBehavior() {
        this.time.addEvent({
            delay: 1000, // Interval to check shooting (1 second)
            loop: true,
            callback: () => {
                const cols = 11; // The total number of columns in the grid
                
                for (let col = 0; col < cols; col++) {
                    // Find the lowest alive enemy in the current column
                    const shooter = this.findLowestAliveInColumn(col);
                    
                    // If there's a shooter in this column, make it shoot
                    if (shooter && Phaser.Math.Between(1, 100) > 90) { // 10% random chance to shoot
                        this.enemyShoot(shooter);
                    }
                }
            }
            
        });
    }
    
    enemyShoot(enemy) {
        const bullet = this.enemyBullets.create(enemy.x, enemy.y + 10, 'enemyBullet'); // Adjust sprite key if needed
        if (bullet) {
            bullet.setVelocityY(200); // Enemy bullets move downward
        }
    }
    
    handlePlayerHit(player, bullet) {
        // Destroy the bullet on collision
        bullet.destroy();
        
        // Decrease shield strength if available
        if (this.shieldStrength > 0) {
            this.shieldStrength -= 20; // Example damage value
            if (this.shieldStrength < 0) this.shieldStrength = 0; // Prevent negative values
        } else {
            // If shield is depleted, reduce lives
            this.playerLives -= 1;
            // reset shield to 100%
            this.shieldStrength = 100;
        }
        
        // Update the UI
        this.updateStatusText();
        
        // Check if the game is over
        if (this.playerLives <= 0) {
            this.gameOver();
        }
    }
    
    updateStatusText() {
        this.livesText.setText(`Lives: ${this.playerLives}`);
        this.shieldText.setText(`Shield: ${this.shieldStrength}%`);
    }
    
    
    findLowestAliveInColumn(column) {
        const enemiesInColumn = this.enemies.getChildren().filter(enemy => {
            return enemy.active && enemy.column === column; // Grab only living enemies in the column
        });
        
        // Find the enemy with the highest `row` (the lowest, visually, in the column)
        if (enemiesInColumn.length > 0) {
            return enemiesInColumn.reduce((lowest, current) => {
                return current.row > lowest.row ? current : lowest;
            });
        }
        
        return null; // Return null if no enemies are alive in this column
    }
    
    gameOver() {
        // Stop all game logic
        this.physics.pause(); // Stops all physics activity
        this.player.setTint(0xff0000); // Optional: Tint the player red to indicate the game is over
        
        // Transition to the GameOver scene
        this.scene.start('GameOver', {
            score: this.score
        });
    }
  
  // Add to Game.js
  shutdown() {
    console.log('Game.js: shutdown() called!'); // Confirm the scene ends correctly
    
    // Destroy all remaining objects
    if (this.enemies) {
      this.enemies.clear(true, true); // Reset group and remove all existing objects
    }
    
    if (this.bullets) {
      this.bullets.clear(true, true); // Clear bullets group
    }
    
    if (this.enemyBullets) {
      this.enemyBullets.clear(true, true); // Clear enemy bullets group
    }
    
    if (this.player) {
      this.player.destroy(); // Remove player
    }
    
    // Reset other objects if necessary
    this.starArray = [];
    if (this.stars) {
      this.stars.clear();
    }
  }
}