# Roblox VFX Asset ID Reference

A comprehensive list of VFX-related asset IDs found across Roblox documentation, the Creator Store, DevForum, and official API references. Use these in `ParticleEmitter.Texture`, `Decal`, `Texture`, `MeshPart.MeshId`, and similar properties.

---

## 📦 Built-in Particle Textures

These are **built-in** textures that ship with Roblox (no `rbxassetid://` needed — use `rbxasset://` path):

| Texture | Path | Notes |
|---------|------|-------|
| 🔥 Fire main | `rbxasset://textures/particles/fire_main.dds` | Default fire particle texture |
| 💨 Smoke main | `rbxasset://textures/particles/smoke_main.dds` | Default smoke particle texture |
| ✨ Sparkles | `rbxasset://textures/particles/sparkles_main.dds` | Default sparkle texture |
| 💎 Sparkle (alternate) | `rbxasset://textures/sparkle.png` | Legacy sparkle icon |
| 💥 Explosion | `rbxasset://textures/explosion.png` | Legacy explosion icon |
| 🌟 Glow | `rbxasset://textures/glow.png` | Legacy glow effect |
| 🔦 Gradient | `rbxasset://textures/gradient.png` | Gradient overlay |

> **Source:** [ParticleEmitter API Reference](https://create.roblox.com/docs/reference/engine/classes/ParticleEmitter) — default `Texture` property

---

## 🔥 Fire & Explosion Particles

| ID | Asset | Description | Source |
|----|-------|-------------|--------|
| `1266170131` | Ring particle | Transparent white ring — common fire/explosion base | [ParticleEmitter Example Code](https://create.roblox.com/docs/reference/engine/classes/ParticleEmitter) |
| `6101261905` | Electric spark texture | Electric spark for explosion effects | [Create explosions with VFX tutorial](https://create.roblox.com/docs/tutorials/use-case-tutorials/vfx/use-particles-for-explosions) |
| `8983307836` | Flare texture | Flare/glowing particle for focal points | [Create basic visual effects](https://create.roblox.com/docs/tutorials/curriculums/core/building/create-basic-visual-effects) |
| `2903918852` | Gold nugget mesh | Gold nugget MeshId for sparkle effects | [Basic particle effects tutorial](https://create.roblox.com/docs/tutorials/use-case-tutorials/vfx/basic-particle-effects) |

---

## 💥 Explosion & Burst Textures (from Mansion of Wonder)

| ID | Effect | Notes |
|----|--------|-------|
| `6772766862` | Burst particles 1 | Celebratory burst texture |
| `6772766551` | Burst particles 2 | Celebratory burst texture |
| `5857851618` | Burst particles 3 | Celebratory burst texture |
| `6805662633` | Burst particles 4 | Celebratory burst texture |

> **Source:** [Use particles for actions](https://github.com/Roblox/creator-docs/blob/main/content/en-us/education/build-it-play-it-mansion-of-wonder/using-particles-for-actions.md) — Mansion of Wonder template

---

## 🌪️ Smoke & Atmosphere

| ID | Asset | Description |
|----|--------|-------------|
| (built-in) | `rbxasset://textures/particles/smoke_main.dds` | Default smoke — `ParticleEmitter.Texture` |
| (built-in) | `rbxasset://textures/particles/fire_main.dds` | Default fire — `ParticleEmitter.Texture` |

---

## ⚡ VFX Particle Packs (Creator Store)

| Asset ID | Name | Cost | Type |
|----------|------|------|------|
| `81224039420168` | VFX Pack | Free | Model (3 decals, 918 triangles) |
| `89242445503292` | VortexFX V1.0.6 | Free | Model (3D particle system) |
| `17025681747` | Lunar VFX Free Version | Free | Plugin |
| `8491559721` | Vex 2.0 (Voxel Destruction) | Free | Module — greedy meshing, object pooling |

> **Source:** [Creator Store](https://create.roblox.com/store/asset/81224039420168/VFX-Pack), [VortexFX](https://create.roblox.com/store/asset/89242445503292/VortexFX-V106), [Lunar VFX](https://create.roblox.com/store/asset/17025681747/Lunar-VFX-Free-Version)

---

## 🧱 Voxel Destruction Modules (related to VDP)

| Asset ID | Name | Description |
|----------|------|-------------|
| `8491559721` | Vex 2.0 | Voxel destruction module — greedy meshing, object pooling, force application |
| (model) | Shatterbox (v8) | Client-server voxel destruction — true greedy meshing, Puppeteer system |
| (model) | VoxBreaker | Open-source — quadtree/octree partitioning, OOP-based |
| (model) | CSG Voxel | Server-side voxel destruction using `GeometryService:SubtractAsync()` |

---

## 🎨 Decal & Texture IDs (common)

| ID | Type | Description |
|----|------|-------------|
| `26424652` | Happy face | Decal — used in `Decal` examples |
| `147144198` | Sad face | Decal — used in `Decal` examples |
| `1156386453` | Example decal | Example decal → image ID conversion |

> **Source:** [Decal class reference](https://create.roblox.com/docs/en-us/reference/engine/classes/Decal), [Convert decal ID to image ID](https://devforum.roblox.com/t/convert-decal-id-to-image-id-2025/3401001)

---

## 🛠️ How to Use These

**In Lua / Luau (Roblox Studio):**

```lua
-- ParticleEmitter
local emitter = Instance.new("ParticleEmitter")
emitter.Texture = "rbxassetid://1266170131"  -- white ring
emitter.Rate = 5
emitter.Lifetime = NumberRange.new(1, 1)

-- Decal
local decal = Instance.new("Decal")
decal.Face = Enum.NormalId.Top
decal.ColorMapContent = "rbxassetid://26424652"

-- MeshPart
local mesh = Instance.new("MeshPart")
mesh.MeshId = "rbxassetid://2903918852"

-- Built-in path (no asset ID needed)
emitter.Texture = "rbxasset://textures/particles/fire_main.dds"
```

**Getting your own IDs:**
1. Upload an image to Roblox → it gets an `assetid`
2. Find it at `https://www.roblox.com/library/<assetID>`
3. Use `rbxassetid://<ID>` in your script

---

## Reference Links

- [ParticleEmitter API reference](https://create.roblox.com/docs/reference/engine/classes/ParticleEmitter)
- [Decal class](https://create.roblox.com/docs/en-us/reference/engine/classes/Decal)
- [Particle emitters tutorial](https://create.roblox.com/docs/effects/particle-emitters)
- [Create explosions with VFX](https://create.roblox.com/docs/tutorials/use-case-tutorials/vfx/use-particles-for-explosions)
- [Creator Store](https://create.roblox.com/docs/en-us/production/creator-store.md)
- [Built-in textures list](https://devforum.roblox.com/t/list-of-built-in-roblox-imagestextures/2960345)
- [Voxel Destruction Physics (VDP) game](https://www.roblox.com/games/11594344738/Voxel-Destruction-Physics)