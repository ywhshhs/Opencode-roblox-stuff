local Library = loadstring(game:HttpGet("https://raw.githubusercontent.com/sametexe001/sametlibs/refs/heads/main/lds13/Library.lua"))()

local Window = Library:Window({
    Name = "Window",
    SubTitle = "SubName",
    TimeRemaining = "5 years"
})

local Pages = { }

for Index = 1, 4 do 
    Pages[Index] = Window:Page({
        Icon = "131145598162617",
        Columns = 2
    })
end

local SettingsPage = Library:CreateSettingsPage(Window)

local SectionLeft = Pages[1]:Section({Name = "Section", Icon = "131145598162617", Side = 1})
local SectionRight = Pages[1]:Section({Name = "Section", Icon = "131145598162617", Side = 2})

local Toggle = SectionLeft:Toggle({
    Name = "Toggle",
    Flag = "Toggle",
    Default = false,
    Callback = function(Value)
        print(Value)
    end
})

SectionLeft:Button({
    Name = "Button",
    Callback = function()
        print("Button")
    end
})

SectionLeft:Button({
    Name = "TestNotification",
    Callback = function()
        Library:Notification("This is a notification notifying..", "90449909165261", 5)
    end
})

SectionLeft:Slider({
    Name = "Slider",
    Flag = "Slider",
    Default = 50,
    Min = 0,
    Max = 100,
    Decimals = 1,
    Suffix = "%",
    Callback = function(Value)
        print(Value)
    end
})

SectionLeft:Dropdown({
    Name = "Dropdown",
    Flag = "Dropdown",
    Default = "First",
    Items = {"First", "Second", "Third", "Fourth", "Fifth", "Sixth"},
    MaxSize = 100,
    Callback = function(Value)
        print(Value)
    end
})

SectionLeft:Label("Label")
SectionLeft:Label("Label"):Colorpicker({
    Name = "Colorpicker",
    Flag = "Colorpicker",
    Default = Color3.fromRGB(255, 255, 255),
    Callback = function(Value)
        print(Value)
    end
})

SectionLeft:Label("Keybind"):Keybind({
    Name = "Keybind",
    Flag = "Keybind",
    Default = Enum.KeyCode.E,
    Callback = function(Value)
        print(Value)
    end
})

SectionLeft:Textbox({
    Name = "Textbox",
    Flag = "Textbox",
    Default = "Text",
    Numeric = false,
    Finished = true,
    Callback = function(Value)
        print(Value)
    end
})
