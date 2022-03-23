import React, { useCallback, useState, useEffect } from "react"

import Navigation from "./components/Navigation"
import Field from "./components/Field"
import Button from "./components/Button"
import ManipulationPanel from "./components/ManipulationPanel"

import { initFields, getFoodPosition } from "./utils"

import {
  defaultInterval,
  defaultDifficulty,
  Delta,
  Difficulty,
  Direction,
  DirectionKeyCodeMap,
  GameStatus,
  OppositeDirection,
  initialPosition,
  initialValues,
} from "./constants"

let timer = undefined

const unsubscribe = () => {
  if (!timer) {
    return
  }
  clearInterval(timer)
}

const isCollision = (fieldSize, position) => {
  if (position.y < 0 || position.x < 0) {
    return true
  }

  if (position.y > fieldSize - 1 || position.x > fieldSize - 1) {
    return true
  }

  return false
}

const isEatingMyself = (fields, position) => {
  return fields[position.y][position.x] === "snake"
}

function App() {
  const [fields, setFields] = useState(initialValues)
  const [body, setBody] = useState([])
  const [tick, setTick] = useState(0)
  const [status, setStatus] = useState(GameStatus.init)
  const [difficulty, setDifficulty] = useState(defaultDifficulty)
  const [direction, setDirection] = useState(Direction.up)

  useEffect(() => {
    setBody([initialPosition])
    // ゲームの中の時間を管理する
    const interval = Difficulty[difficulty - 1]
    timer = setInterval(() => {
      setTick((tick) => tick + 1)
    }, interval)
    return unsubscribe
  }, [tick])

  useEffect(() => {
    if (!body.length === 0 || status !== GameStatus.playing) {
      return
    }
    const canContinue = handleMoving()
    if (!canContinue) {
      unsubscribe()
      setStatus(GameStatus.gameover)
    }
  }, [tick])

  const onStart = () => setStatus(GameStatus.playing)

  const onStop = () => setStatus(GameStatus.suspended)

  const onRestart = () => {
    timer = setInterval(() => {
      setTick((tick) => tick + 1)
    }, defaultInterval)
    setDirection(Direction.up)
    setStatus(GameStatus.init)
    setBody([initialPosition])
    setFields(initFields(35, initialPosition))
  }

  const onChangeDirection = useCallback(
    (newDirection) => {
      if (status !== GameStatus.playing) {
        return direction
      }
      if (OppositeDirection[direction] === newDirection) {
        return
      }
      setDirection(newDirection)
    },
    [direction, status]
  )

  const onChangeDifficulty = useCallback(
    (difficulty) => {
      if (status !== GameStatus.init) {
        return
      }
      if (difficulty < 1 || difficulty > difficulty.length) {
        return
      }
      setDifficulty(difficulty)
    },
    [status, difficulty]
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      const newDirection = DirectionKeyCodeMap[e.keyCode]
      if (!newDirection) {
        return
      }

      onChangeDirection(newDirection)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onChangeDirection])

  const handleMoving = () => {
    const { x, y } = body[0]
    const delta = Delta[direction]
    const newPosition = {
      x: x + delta.x,
      y: y + delta.y,
    }
    if (
      isCollision(fields.length, newPosition) ||
      isEatingMyself(fields, newPosition)
    ) {
      return false
    }
    const newBody = [...body]
    if (fields[newPosition.y][newPosition.x] !== "food") {
      const removingTrack = newBody.pop()
      fields[removingTrack.y][removingTrack.x] = ""
    } else {
      const food = getFoodPosition(fields.length, [...newBody, newPosition])
      fields[food.y][food.x] = "food"
    }
    fields[newPosition.y][newPosition.x] = "snake"
    newBody.unshift(newPosition)
    setBody(newBody)
    setFields(fields)
    return true
  }
  return (
    <div className="App">
      <header className="header">
        <div className="title-container">
          <h1 className="title">Snake Game</h1>
        </div>
        <Navigation
          length={body.length}
          difficulty={difficulty}
          onChangeDifficulty={onChangeDifficulty}
        />
      </header>
      <main className="main">
        <Field fields={fields} />
      </main>
      <footer className="footer">
        <Button
          status={status}
          onStart={onStart}
          onRestart={onRestart}
          onStop={onStop}
        />
        <ManipulationPanel onChange={onChangeDirection} />
      </footer>
    </div>
  )
}
export default App
