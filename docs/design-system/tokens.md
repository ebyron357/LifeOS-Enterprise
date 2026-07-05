# Design Tokens

All token values for LifeOS Enterprise. Tokens are the single source of truth for visual values. Implementation repositories must use these tokens, not hardcoded values.

---

## Color Tokens

### Neutral Scale
```
neutral-0:   #FFFFFF
neutral-50:  #F9FAFB
neutral-100: #F3F4F6
neutral-200: #E5E7EB
neutral-300: #D1D5DB
neutral-400: #9CA3AF
neutral-500: #6B7280
neutral-600: #4B5563
neutral-700: #374151
neutral-800: #1F2937
neutral-900: #111827
neutral-950: #030712
```

### Brand (Primary) Scale
```
brand-50:   #EEF2FF
brand-100:  #E0E7FF
brand-200:  #C7D2FE
brand-300:  #A5B4FC
brand-400:  #818CF8
brand-500:  #6366F1   ← primary action color
brand-600:  #4F46E5
brand-700:  #4338CA
brand-800:  #3730A3
brand-900:  #312E81
```

### Semantic Color Mappings

#### Light Mode
```
color-primary:         brand-500 (#6366F1)
color-primary-hover:   brand-600 (#4F46E5)
color-primary-muted:   brand-50  (#EEF2FF)

color-surface:         neutral-0   (#FFFFFF)
color-surface-subtle:  neutral-50  (#F9FAFB)
color-surface-raised:  neutral-0   (#FFFFFF) + elevation-1
color-border:          neutral-200 (#E5E7EB)
color-border-strong:   neutral-300 (#D1D5DB)

color-text-primary:    neutral-900 (#111827)
color-text-secondary:  neutral-600 (#4B5563)
color-text-muted:      neutral-400 (#9CA3AF)
color-text-inverse:    neutral-0   (#FFFFFF)

color-success:         #16A34A
color-success-muted:   #DCFCE7
color-warning:         #D97706
color-warning-muted:   #FEF3C7
color-danger:          #DC2626
color-danger-muted:    #FEE2E2
color-info:            #0EA5E9
color-info-muted:      #E0F2FE
color-agent:           #8B5CF6
color-agent-muted:     #EDE9FE
```

#### Dark Mode
```
color-primary:         brand-400 (#818CF8)
color-primary-hover:   brand-300 (#A5B4FC)
color-primary-muted:   brand-900 (#312E81)

color-surface:         neutral-950 (#030712)
color-surface-subtle:  neutral-900 (#111827)
color-surface-raised:  neutral-800 (#1F2937)
color-border:          neutral-800 (#1F2937)
color-border-strong:   neutral-700 (#374151)

color-text-primary:    neutral-50  (#F9FAFB)
color-text-secondary:  neutral-400 (#9CA3AF)
color-text-muted:      neutral-600 (#4B5563)
color-text-inverse:    neutral-900 (#111827)
```

---

## Spacing Tokens

```
space-0:   0px
space-px:  1px
space-0.5: 2px
space-1:   4px
space-1.5: 6px
space-2:   8px
space-2.5: 10px
space-3:   12px
space-3.5: 14px
space-4:   16px
space-5:   20px
space-6:   24px
space-7:   28px
space-8:   32px
space-9:   36px
space-10:  40px
space-12:  48px
space-14:  56px
space-16:  64px
space-20:  80px
space-24:  96px
space-32:  128px
```

---

## Typography Tokens

```
font-family-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
font-family-mono: "JetBrains Mono", "Fira Code", Consolas, monospace

font-size-xs:   11px
font-size-sm:   12px
font-size-md:   14px
font-size-base: 16px
font-size-lg:   18px
font-size-xl:   20px
font-size-2xl:  24px
font-size-3xl:  28px
font-size-4xl:  36px
font-size-5xl:  48px

font-weight-normal:   400
font-weight-medium:   500
font-weight-semibold: 600
font-weight-bold:     700

line-height-tight:  1.25
line-height-snug:   1.375
line-height-normal: 1.5
line-height-relaxed: 1.625
line-height-loose:  2

letter-spacing-tight:  -0.05em
letter-spacing-normal: 0em
letter-spacing-wide:   0.025em
letter-spacing-wider:  0.05em
```

---

## Shadow Tokens

```
shadow-none:  none
shadow-sm:    0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow-md:    0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
shadow-lg:    0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
shadow-xl:    0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
shadow-2xl:   0 25px 50px -12px rgb(0 0 0 / 0.25)
```

---

## Border Radius Tokens

```
radius-none: 0px
radius-sm:   4px
radius-md:   8px
radius-lg:   12px
radius-xl:   16px
radius-2xl:  20px
radius-3xl:  24px
radius-full: 9999px
```

---

## Z-Index Scale

```
z-base:    0
z-raised:  1
z-dropdown: 100
z-sticky:  200
z-overlay: 300
z-modal:   400
z-toast:   500
z-tooltip: 600
z-command: 700
```

---

## Motion Tokens

```
duration-instant: 0ms
duration-fast:    100ms
duration-normal:  200ms
duration-slow:    350ms
duration-slower:  500ms

easing-linear:   linear
easing-default:  cubic-bezier(0.4, 0, 0.2, 1)
easing-in:       cubic-bezier(0.4, 0, 1, 1)
easing-out:      cubic-bezier(0, 0, 0.2, 1)
easing-spring:   cubic-bezier(0.34, 1.56, 0.64, 1)
```
