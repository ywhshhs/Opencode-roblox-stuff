--[[
    Core.lua — Nova UI Framework
    Base library with shared helpers, theme system, and UI management.
    All widgets in Elements.lua require this module.
]]

-- executor compat
cloneref = cloneref or function(o) return o end
gethui = gethui or function() return cloneref(game:GetService("CoreGui")) end

--#region Services
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")
local HttpService = game:GetService("HttpService")
local TweenService = game:GetService("TweenService")
local Lighting = game:GetService("Lighting")
local CoreGui = cloneref(game:GetService("CoreGui"))
local GuiService = game:GetService("GuiService")
local ContextActionService = game:GetService("ContextActionService")
--#endregion

local LocalPlayer = Players.LocalPlayer
local Camera = Workspace.CurrentCamera
local GuiInset = GuiService:GetGuiInset().Y

--#region Theme Preset
local Theme = {
    Background       = Color3.fromRGB(18, 19, 22),
    Outline          = Color3.fromRGB(38, 40, 47),
    Border           = Color3.fromRGB(8, 9, 11),
    Accent           = Color3.fromRGB(150, 185, 255),
    Risky            = Color3.fromRGB(255, 50, 50),
    Text             = Color3.fromRGB(185, 185, 185),
    DimText          = Color3.fromRGB(105, 105, 105),
    Section          = Color3.fromRGB(21, 22, 26),
    Element          = Color3.fromRGB(29, 30, 36),
    Hover            = Color3.fromRGB(37, 39, 46),
}
--#endregion

--====================================================================--
--  Nova Core
--====================================================================--
local Nova = {
    Flags       = {},
    SetFlags    = {},
    Connections  = {},
    Threads     = {},
    OpenFrames  = {},
    Theme       = Theme,
    ThemeMap    = {},
    ThemeItems  = {},
    FontSize    = 9,
    AnimTime    = 0.3,
    AnimStyle   = "Quint",
    AnimDir     = "Out",

    -- layout constants
    PaddingElem  = 7,    -- between elements in a section
    SectionPadL  = 36,   -- left padding in section content
    SectionPadT  = 15,   -- top padding
    SectionPadB  = 20,   -- bottom padding
    ToggleOff    = 20,   -- toggle button horizontal offset
    ToggleTextOff = 14,  -- toggle text label offset
    SliderH      = 25,   -- slider container height
    ButtonH      = 18,   -- button height
    TabH         = 30,   -- page tab bar height
    EdgeT        = 2,    -- resize edge thickness

    -- holders
    UnusedHolder = nil,
    Holder       = nil,
    NotifHolder  = nil,
}

do
    Nova.__index = Nova

    --#region Helpers
    function Nova:Create(Class, Props)
        local inst = Instance.new(Class)
        for k, v in Props do
            pcall(function() inst[k] = v end)
        end
        return setmetatable({ Instance = inst }, { __index = function(tbl, key)
            if key == "Class" then return Class end
            if key == "Properties" then return Props end
            return rawget(tbl, key) or inst[key]
        end })
    end

    function Nova:Mk(Class, Props)
        -- shorthand that also parents
        local obj = Nova:Create(Class, Props)
        return obj
    end

    function Nova:Connect(Signal, fn)
        local c
        if type(Signal) == "table" and Signal.Connect then
            c = Signal:Connect(fn)
        else
            c = Signal:Connect(fn)
        end
        table.insert(Nova.Connections, c)
        return c
    end

    function Nova:Thread(fn)
        local t = coroutine.create(fn)
        coroutine.wrap(function() coroutine.resume(t) end)()
        table.insert(Nova.Threads, t)
        return t
    end

    function Nova:Tween(obj, props, info)
        if not obj then return end
        info = info or TweenInfo.new(Nova.AnimTime, Enum.EasingStyle[Nova.AnimStyle], Enum.EasingDirection[Nova.AnimDir])
        local t = TweenService:Create(obj, info, props)
        t:Play()
        return t
    end

    function Nova:AddTheme(obj, map)
        -- map: { PropertyName = "ThemeKey" } or { PropertyName = function() return val end }
        for prop, val in map do
            if type(val) == "string" and Nova.Theme[val] then
                obj[prop] = Nova.Theme[val]
            elseif type(val) == "function" then
                obj[prop] = val()
            end
        end
        table.insert(Nova.ThemeItems, { Item = obj, Map = map })
        if not Nova.ThemeMap[obj] then
            Nova.ThemeMap[obj] = {}
        end
        Nova.ThemeMap[obj] = map
        return obj
    end

    function Nova:ChangeTheme(key, color)
        Nova.Theme[key] = color
        for _, item in Nova.ThemeItems do
            for prop, val in item.Map do
                if type(val) == "string" and val == key then
                    item.Item[prop] = color
                elseif type(val) == "function" then
                    item.Item[prop] = val()
                end
            end
        end
    end

    function Nova:SafeCall(fn, ...)
        local ok, r = pcall(fn, ...)
        if not ok then warn(r) end
        return ok, r
    end

    function Nova:IsOver(obj)
        local m = LocalPlayer:GetMouse()
        local pos = Vector2.new(m.X, m.Y)
        return pos.X >= obj.AbsolutePosition.X
            and pos.X <= obj.AbsolutePosition.X + obj.AbsoluteSize.X
            and pos.Y >= obj.AbsolutePosition.Y
            and pos.Y <= obj.AbsolutePosition.Y + obj.AbsoluteSize.Y
    end

    function Nova:GetTweenProp(obj)
        if obj:IsA("Frame") then
            return { "BackgroundTransparency" }
        elseif obj:IsA("TextLabel") or obj:IsA("TextButton") then
            return { "TextTransparency", "BackgroundTransparency" }
        elseif obj:IsA("ImageLabel") then
            return { "ImageTransparency", "BackgroundTransparency" }
        elseif obj:IsA("ScrollingFrame") then
            return { "ScrollBarImageTransparency" }
        elseif obj:IsA("TextBox") then
            return { "TextTransparency", "BackgroundTransparency" }
        elseif obj:IsA("UIStroke") then
            return { "Transparency" }
        end
    end

    function Nova:FadeDescendants(root, visible, cb)
        local all = root:GetDescendants()
        table.insert(all, root)
        if visible then
            for _, c in all do
                if c:IsA("GuiObject") then
                    c.Visible = true
                end
                if c:IsA("Frame") or c:IsA("TextButton") then
                    c.Visible = true
                end
            end
            root.Visible = true
        end

        -- animate
        local done
        for _, c in all do
            if c:IsA("GuiBase") then
                local props = Nova:GetTweenProp(c)
                if props then
                    local target = visible and 0 or 1
                    for _, prop in props do
                        done = Nova:Tween(c, { [prop] = target })
                    end
                end
            end
        end
        if done then
            Nova:Connect(done.Completed, function()
                if cb then cb() end
                if not visible then
                    root.Visible = false
                end
            end)
        else
            if cb then cb() end
            if not visible then root.Visible = false end
        end
    end

    --#endregion

    --#region Holder
    do
        local holder = Instance.new("ScreenGui")
        holder.Name = "\0"
        holder.ZIndexBehavior = Enum.ZIndexBehavior.Global
        holder.IgnoreGuiInset = true
        holder.ResetOnSpawn = false
        -- assign after parent — handled by user via loadstring
        Nova.Holder = { Instance = holder }

        local unused = Instance.new("ScreenGui")
        unused.Name = "\0"
        unused.Enabled = false
        unused.ZIndexBehavior = Enum.ZIndexBehavior.Global
        Nova.UnusedHolder = { Instance = unused }

        -- notification holder
        local notif = Instance.new("Frame")
        notif.Name = "\0"
        notif.BackgroundTransparency = 1
        notif.Position = UDim2.new(1, -8, 0, 10)
        notif.Size = UDim2.new(0, 0, 1, 0)
        notif.AutomaticSize = Enum.AutomaticSize.X
        notif.BorderSizePixel = 0
        notif.Parent = holder
        Nova.NotifHolder = { Instance = notif }

        local notifLayout = Instance.new("UIListLayout")
        notifLayout.SortOrder = Enum.SortOrder.LayoutOrder
        notifLayout.HorizontalAlignment = Enum.HorizontalAlignment.Right
        notifLayout.Padding = UDim.new(0, 4)
        notifLayout.Parent = notif

        local notifPad = Instance.new("UIPadding")
        notifPad.PaddingTop = UDim.new(0, 10)
        notifPad.PaddingBottom = UDim.new(0, 8)
        notifPad.PaddingRight = UDim.new(0, 8)
        notifPad.PaddingLeft = UDim.new(0, 8)
        notifPad.Parent = notif
    end
    --#endregion
end

return Nova