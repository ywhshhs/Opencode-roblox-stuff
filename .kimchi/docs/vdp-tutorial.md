# Voxel Destruction Physics (VDP) — Full Tutorial

**How to build a Teardown-style voxel destruction system in Roblox**

> Based on research from: [CSG Voxel](https://devforum.roblox.com/t/csg-voxel-an-easy-to-use-voxel-destruction-completely-on-serverside/3795156), [Shatterbox](https://devforum.roblox.com/t/shatterbox-client-server-voxel-destruction-simple-and-optimized-release-8/3674163), [Vex 2.0](https://github.com/qrisquinn/Vex-2.0), [VoxBreaker](https://github.com/Bartokens/VoxBreaker), and the [VDP game](https://www.roblox.com/games/11594344738/Voxel-Destruction-Physics)

---

## 📚 Table of Contents

1. [What Is VDP?](#1-what-is-vdp)
2. [Core Concepts](#2-core-concepts)
3. [Architecture Overview](#3-architecture-overview)
4. [Step 1 — Setup: Server & Client](#4-step-1--setup-server--client)
5. [Step 2 — Voxelization Algorithm](#5-step-2--voxelization-algorithm)
6. [Step 3 — Greedy Meshing](#6-step-3--greedy-meshing)
7. [Step 4 — CSG Subtraction & Physics](#7-step-4--csg-subtraction--physics)
8. [Step 5 — Force Application & Debris](#8-step-5--force-application--debris)
9. [Step 6 — Optimization](#9-step-6--optimization)
10. [Full Example Code](#10-full-example-code)
11. [Existing Modules You Can Use](#11-existing-modules-you-can-use)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What Is VDP?

**Voxel Destruction Physics** is a Roblox gameplay style where every part in the world is **breakable down into smaller chunks** (voxels) that respond to physics. It's inspired by:

- **Teardown** (PC game) — fully destructible environments, voxel-by-voxel
- **Jujutsu Shenanigans** (Roblox game) — fast, server-side voxel destruction
- **Voxel Destruction Physics** (the Roblox game) — `rbxassetid://11594344738`

---

## 2. Core Concepts

| Concept | Definition |
|---------|------------|
| **Voxel** | A 3D pixel — a tiny cube (usually 1×1×1 stud) that represents one unit of a larger object |
| **Voxelization** | The process of breaking a large part into a grid of smaller cubes |
| **CSG** | Constructive Solid Geometry — `GeometryService:SubtractAsync()` to cut shapes |
| **Greedy Meshing** | Merging adjacent same-material voxels into one larger part (dramatically reduces part count) |
| **Object Pooling** | Recycling existing parts instead of creating/destroying every frame |
| **Octree/Quadtree** | Spatial partitioning — divides space into 4/8 regions for faster collision checks |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  SERVER                               │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Hitbox    │→│ Voxel Grid    │→│ CSG Subtract    │ │
│  │ Detection │  │ (voxelize)   │  │ (GeometrySvc)  │ │
│  └──────────┘  └──────────────┘  └────────────────┘ │
│                       ↓                              │
│  ┌──────────┐  ┌──────────────┐                     │
│  │ Greedy   │→│ Physics Force  │→ Debris Cleanup    │
│  │ Mesher   │  │ (fragments)   │                     │
│  └──────────┘  └──────────────┘                     │
│                       ↓                              │
│  ┌──────────────────────────────────────┐           │
│  │ RemoteEvent ←─ Client-ReplicatedStorage│         │
│  └──────────────────────────────────────┘           │
├─────────────────────────────────────────────────────┤
│                  CLIENT                              │
│  ┌──────────────┐                                   │
│  │ Fire weapon   │→ Send hitbox to server         │
│  │ (visual only) │                                   │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

**Key rule:** `GeometryService` is **server-only**. All CSG operations must run on the server.

---

## 4. Step 1 — Setup: Server & Client

### Folder Structure

```
ReplicatedStorage
├── VoxelModule (ModuleScript) ← main module
├── RemoteEvents
│   └── DestructionRequest (RemoteEvent)
ServerScriptService
├── DestructionService (Script) ← processes destruction
└── VoxelServer (ModuleScript)   ← optional module
```

### Replication Setup

```lua
-- Shared (ModuleScript in ReplicatedStorage)
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DestructionRequest = Instance.new("RemoteEvent")
DestructionRequest.Name = "DestructionRequest"
DestructionRequest.Parent = ReplicatedStorage

-- Client fires: DestructionRequest:FireServer(hitboxPart, weaponData)
-- Server listens: DestructionRequest.OnServerEvent:Connect(handler)
```

---

## 5. Step 2 — Voxelization Algorithm

This is the **core** of VDP. Given a **hitbox part** (the blast radius), we convert its volume into a grid of small cubes.

### Pure Voxelization (no CSG)

```lua
local function VoxelizePart(targetPart, voxelSize, hitboxCFrame)
    -- 1. Get the bounding box of the target part
    local cf, size = targetPart:GetBoundingBox()
    
    -- 2. Convert to grid coordinates
    local min = cf.Position - size / 2
    local max = cf.Position + size / 2
    
    -- 3. Iterate in voxelSize steps
    local voxels = {}
    for x = min.X, max.X, voxelSize do
        for y = min.Y, max.Y, voxelSize do
            for z = min.Z, max.Z, voxelSize do
                -- 4. Check if this voxel is inside the hitbox
                local voxelPos = Vector3.new(x, y, z)
                if hitboxCFrame and isInsideHitbox(voxelPos, hitboxCFrame) then
                    table.insert(voxels, voxelPos)
                end
            end
        end
    end
    
    return voxels
end
```

### Using `GeometryService` for true CSG Voxelization

```lua
local GeometryService = game:GetService("GeometryService")
local Debris = game:GetService("Debris")

local function VoxelizeWithCSG(targetPart, hitboxPart)
    -- 1. Subtract hitbox from target
    local results = GeometryService:SubtractAsync({
        PartA = targetPart,
        PartB = hitboxPart,
    })
    
    -- 2. Each result part is a fragment
    for _, fragment in pairs(results) do
        -- Tag for physics
        fragment:AddTag("Destroyable")
        
        -- Apply velocity
        local velocity = Instance.new("BodyVelocity")
        velocity.Velocity = Vector3.new(
            math.random(-50, 50),
            math.random(20, 100),
            math.random(-50, 50)
        )
        velocity.Parent = fragment
        
        -- Set parent
        fragment.Parent = workspace
        
        -- Cleanup
        Debris:AddItem(fragment, 5)
    end
    
    -- 3. Remove original
    targetPart:Destroy()
end
```

> **Source:** [CSG Voxel — `GeometryService:SubtractAsync()`](https://devforum.roblox.com/t/csg-voxel-an-easy-to-use-voxel-destruction-completely-on-serverside/3795156)

---

## 6. Step 3 — Greedy Meshing

**Why:** Without greedy meshing, a single 100×100 wall creates **10,000** individual parts (FPS = 0). With greedy meshing, it creates **~50–200** merged parts.

### Algorithm

```lua
local function GreedyMesh(voxelGrid, voxelSize)
    -- 1. Create a 3D boolean array (filled = true)
    -- 2. For each axis (X, Y, Z):
    --    a. Find the longest contiguous row of filled voxels
    --    b. Create one Part covering that entire row
    --    c. Mark those voxels as "processed"
    -- 3. Repeat until all voxels are processed
    
    local mergedParts = {}
    local processed = {} -- key: "x,y,z" -> bool
    
    for _, voxelPos in ipairs(voxelGrid) do
        local key = tostring(voxelPos)
        if processed[key] then continue end
        
        -- Find contiguous span in X direction
        local endX = voxelPos.X
        while true do
            local nextKey = tostring(Vector3.new(endX + voxelSize, voxelPos.Y, voxelPos.Z))
            if processed[nextKey] or not isInGrid(nextKey) then break end
            endX = endX + voxelSize
        end
        
        -- Create one merged part
        local part = Instance.new("Part")
        part.Size = Vector3.new(endX - voxelPos.X + voxelSize, voxelSize, voxelSize)
        part.Position = voxelPos + Vector3.new((endX - voxelPos.X) / 2, 0, 0)
        part.Anchored = false
        table.insert(mergedParts, part)
    end
    
    return mergedParts
end
```

> **Source:** [VoxelDestruct](https://devforum.roblox.com/t/moved-voxeldestruct-voxelated-destruction-physics-with-greedy-meshing-hitboxes-and-more/3041472), [Vex 2.0](https://github.com/qrisquinn/Vex-2.0)

---

## 7. Step 4 — CSG Subtraction & Physics

This is what makes walls **actually break**.

```lua
-- ServerScriptService/DestructionService
local GeometryService = game:GetService("GeometryService")
local Debris = game:GetService("Debris")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local DestructionRequest = ReplicatedStorage:FindFirstChild("DestructionRequest")

DestructionRequest.OnServerEvent:Connect(function(player, hitboxPart, targetPart)
    -- 1. Voxelize the hitbox
    local voxels = VoxelizePart(targetPart, 1, hitboxPart.CFrame)
    
    -- 2. For each voxel inside the hitbox, subtract
    for _, voxelPos in ipairs(voxels) do
        -- Create a temporary voxel part for subtraction
        local voxelPart = Instance.new("Part")
        voxelPart.Size = Vector3.new(1, 1, 1)
        voxelPart.Position = voxelPos
        voxelPart.Anchored = true
        voxelPart.Transparency = 1
        voxelPart.Parent = workspace
        
        -- Perform subtraction
        local success, result = pcall(function()
            return GeometryService:SubtractAsync({
                PartA = targetPart,
                PartB = voxelPart,
            })
        end)
        
        if success and result then
            for _, frag in ipairs(result) do
                -- Apply physics
                frag:AddTag("Destroyable")
                
                local bv = Instance.new("BodyVelocity")
                bv.Velocity = Vector3.new(
                    math.random(-50, 50),
                    math.random(50, 100),
                    math.random(-50, 50)
                )
                bv.Parent = frag
                
                frag.Parent = workspace
                Debris:AddItem(frag, 5)
            end
        end
        
        voxelPart:Destroy()
    end
end)
```

---

## 8. Step 5 — Force Application & Debris

After a voxel is destroyed, make it fly apart:

```lua
-- Force types
local function ApplyExplosionForce(fragments, origin, force)
    for _, frag in ipairs(fragments) do
        local dir = (frag.Position - origin).Unit
        local distance = (frag.Position - origin).Magnitude
        
        -- Force decreases with distance
        local mag = force / (distance + 1)
        
        local bv = Instance.new("BodyVelocity")
        bv.Velocity = dir * mag
        bv.Parent = frag
    end
end

-- Debris cleanup (use built-in service)
local Debris = game:GetService("Debris")
Debris:AddItem(fragment, 5) -- auto-destroy after 5 seconds
```

---

## 9. Step 6 — Optimization

| Technique | How |
|-----------|-----|
| **Object Pooling** | Keep a `BinFolder` in `ServerStorage`, recycle parts instead of `:Destroy()` |
| **Part Caching** | Cache voxelized hitboxes — if the same hitbox shape is used multiple times, re-use the pre-computed grid |
| **Function Queueing** | Use a queue/task system — don't process all voxels in one frame. Spread over multiple `task.wait()` |
| **Greedy Meshing** | Merge adjacent voxels into larger blocks (see [Step 3](#6-step-3--greedy-meshing)) |
| **Limit Debris Lifetime** | Set `Debris:AddItem(fragment, 3)` — don't let fragments live forever |
| **Server-Only** | Never run CSG on the client — `GeometryService` is server-only |

```lua
-- Object Pooling example
local BinFolder = Instance.new("Folder")
BinFolder.Name = "VoxelBin"
BinFolder.Parent = ServerStorage

-- Instead of :Destroy(), move to bin
fragment.Parent = BinFolder

-- Later, reuse
local recycled = BinFolder:FindFirstChildOfClass("Part")
if recycled then
    recycled.Parent = workspace
    -- reset properties
end
```

> **Source:** [Vex 2.0 — object pooling](https://github.com/qrisquinn/Vex-2.0), [VoxelDestruct](https://devforum.roblox.com/t/moved-voxeldestruct-voxelated-destruction-physics-with-greedy-meshing-hitboxes-and-more/3041472)

---

## 10. Full Example Code

### Minimal working VDP system

```lua
-- ModuleScript: ReplicatedStorage.VDP_Module
local VDP = {}

-- Services
local GeometryService = game:GetService("GeometryService")
local Debris = game:GetService("Debris")
local RunService = game:GetService("RunService")

-- If client, don't run (server-only)
if RunService:IsClient() then
    return VDP
end

-- Configuration
VDP.Config = {
    VoxelSize = 1,          -- 1x1x1 studs
    ExplosionForce = 100,   -- force to apply
    DebrisLifetime = 5,     -- seconds before cleanup
    MaxPartsPerFrame = 50,  -- limit for performance
}

-- Voxelize a part into a grid
function VDP.VoxelizePart(part, voxelSize)
    local cf, size = part:GetBoundingBox()
    local min = cf.Position - size / 2
    local max = cf.Position + size / 2
    local grid = {}
    
    for x = min.X, max.X, voxelSize do
        for y = min.Y, max.Y, voxelSize do
            for z = min.Z, max.Z, voxelSize do
                table.insert(grid, Vector3.new(x, y, z))
            end
        end
    end
    
    return grid
end

-- Apply forces to fragments
function VDP.ApplyExplosion(fragments, origin, force)
    for _, frag in ipairs(fragments) do
        local dir = (frag.Position - origin).Unit
        local dist = (frag.Position - origin).Magnitude
        local mag = force / math.max(dist, 1)
        
        local bv = Instance.new("BodyVelocity")
        bv.Velocity = dir * mag * 10
        bv.MaxForce = Vector3.new(50000, 50000, 50000)
        bv.Parent = frag
        
        Debris:AddItem(frag, VDP.Config.DebrisLifetime)
    end
end

return VDP
```

---

## 11. Existing Modules You Can Use

| Module | Link | Best For |
|--------|------|----------|
| **Vex 2.0** | [GitHub](https://github.com/qrisquinn/Vex-2.0) | Production-ready, greedy meshing, object pooling |
| **Shatterbox (v8)** | [DevForum](https://devforum.roblox.com/t/shatterbox-client-server-voxel-destruction-simple-and-optimized-release-8/3674163) | Client-server, Blink batching, true greedy meshing |
| **VoxBreaker** | [GitHub](https://github.com/Bartokens/VoxBreaker) | Open-source, quadtree/octree, OOP |
| **CSG Voxel** | [DevForum](https://devforum.roblox.com/t/csg-voxel-an-easy-to-use-voxel-destruction-completely-on-serverside/3795156) | Simple server-side CSG, easy to use |
| **VoxelDestruct** | [DevForum](https://devforum.roblox.com/t/moved-voxeldestruct-voxelated-destruction-physics-with-greedy-meshing-hitboxes-and-more/3041472) | Greedy meshing, hitbox support |

---

## 12. Troubleshooting

| Problem | Fix |
|--------|-----|
| **FPS drops when destroying** | Enable greedy meshing, reduce `MaxPartsPerFrame`, use object pooling |
| **Parts flash / vanish** | Disable `StreamingEnabled` for static maps, or use Shatterbox's flash fix |
| **GeometryService fails** | Wrap in `pcall()`, ensure hitbox part is not too large/small |
| **Client can't see debris** | Use `RemoteEvent` to replicate debris positions from server |
| **Too many parts** | Set smaller `VoxelSize` (e.g. 2 instead of 1), merge with greedy meshing |

---

## 🔗 Key Resources

- [Voxel Destruction Physics (VDP) Game](https://www.roblox.com/games/11594344738/Voxel-Destruction-Physics)
- [Roblox GeometryService API](https://create.roblox.com/docs/reference/engine/classes/GeometryService)
- [ParticleEmitter API](https://create.roblox.com/docs/reference/engine/classes/ParticleEmitter)
- [Shatterbox (Release 8)](https://devforum.roblox.com/t/shatterbox-client-server-voxel-destruction-simple-and-optimized-release-8/3674163)
- [Vex 2.0 (MIT)](https://github.com/qrisquinn/Vex-2.0)
- [VoxBreaker (MIT)](https://github.com/Bartokens/VoxBreaker)
- [CSG Voxel Module](https://devforum.roblox.com/t/csg-voxel-an-easy-to-use-voxel-destruction-completely-on-serverside/3795156)
- [YouTube Tutorial — Wall Destruction (Octree)](https://www.youtube.com/watch?v=D8DhttYnNLs)