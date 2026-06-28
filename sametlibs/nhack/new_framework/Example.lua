--[[
    Example.lua — Nova UI Framework
    Demonstrates how to use the Nova UI framework with all widgets.
]]

-- Load the framework
local Nova = require(script.Core)

-- Create a main window
local Window = Nova:Window({
    Title = "Nova UI",
})

-- Add pages
local MainPage = Window:AddPage("Main")
local ConfigsPage = Window:AddPage("Config")

-- Create sections
local AimbotSec = Nova:Section({
    Name = "Aimbot",
    Side = 1,
    Window = Window,
    Page = MainPage,
})

local VisualsSec = Nova:Section({
    Name = "Visuals",
    Side = 2,
    Window = Window,
    Page = MainPage,
})

-- Toggle
Nova:Toggle({
    Name = "Enable Aimbot",
    Flag = "AimbotEnabled",
    Default = false,
    Section = AimbotSec,
    Callback = function(val)
        print("Aimbot:", val)
    end,
})

-- Slider
Nova:Slider({
    Name = "FOV",
    Flag = "AimbotFOV",
    Default = 90,
    Min = 1,
    Max = 360,
    Section = AimbotSec,
    Callback = function(val)
        print("FOV:", val)
    end,
})

-- Button
Nova:Button({
    Name = "Reset",
    Section = AimbotSec,
    Callback = function()
        print("Reset clicked")
    end,
})

-- Dropdown
Nova:Dropdown({
    Name = "Priority",
    Flag = "AimbotPriority",
    Items = { "Head", "Body", "Random" },
    Section = AimbotSec,
    Callback = function(val)
        print("Priority:", val)
    end,
})

-- Visuals
Nova:Toggle({
    Name = "ESP",
    Flag = "ESPEnabled",
    Default = false,
    Section = VisualsSec,
    Callback = function(val)
        print("ESP:", val)
    end,
})

Nova:Slider({
    Name = "Thickness",
    Flag = "ESPThickness",
    Default = 2,
    Min = 1,
    Max = 5,
    Section = VisualsSec,
    Callback = function(val)
        print("Thickness:", val)
    end,
})

Nova:Dropdown({
    Name = "ESP Type",
    Flag = "ESPType",
    Items = { "Box", "Tracer", "Name" },
    Section = VisualsSec,
    Callback = function(val)
        print("ESP type:", val)
    end,
})

-- Notification
Nova:Notification("Nova UI Loaded", 3, Nova.Theme.Accent)

-- New objects
local newObj = {
    Name = "NewObj",
    __type = "Widget",
    newProp = "value"
}

return { Window = Window, Pages = { MainPage, ConfigsPage }, Sections = { AimbotSec, VisualsSec } }