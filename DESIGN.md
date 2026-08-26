# Design: Personal Finance App - Pure White Minimal

## Product Soul
A quiet desk at dawn. Linen tablecloth, a single black pen, a thin notebook. Everything has its place, nothing competes for attention. The numbers speak for themselves.

## Visual Strategy
- Photography: N/A (user-uploaded receipt photos only)
- Graphics: Feather thin-line icons only, 1.5px stroke
- No gradients, no shadows, no decorative elements

## Color Palette
| Role | Value | Origin |
|------|-------|--------|
| Primary text | #111111 | Ink on paper |
| Secondary text | #888888 | Pencil mark |
| Tertiary text | #CCCCCC | Faded pencil |
| Background | #FFFFFF | Clean paper |
| Secondary bg | #F7F7F7 | Paper shadow |
| Border | #ECECEC | Fold line |
| Expense accent | #E85D5D | Red pen mark (only for expense amounts) |
| Income accent | #2D2D2D | Black ink (subtle distinction) |
| Success/positive | #3D9E5F | Green pen (balance positive) |

## Typography
- Titles: 28px, weight 700, letter-spacing -0.5
- Body: 15px, weight 400, line-height 24
- Caption: 12px, weight 500, color #888
- Amount display: 36px, weight 300, monospace feel

## Layout
- Generous whitespace: 24-40px between sections
- Padding: 24px horizontal
- Cards: borderWidth 1, borderColor #ECECEC, borderRadius 12, NO shadow
- Dividers: StyleSheet.hairlineWidth, color #ECECEC

## Interaction
- Buttons: Black fill (#111) for primary, #F7F7F7 for secondary
- Tab bar: White bg, hairline top border, Feather icons, active=#111 inactive=#CCC
- Transitions: opacity fade only, 200ms, Easing.out

## Don'ts
- No colored backgrounds
- No shadows
- No gradients
- No rounded pills (use radius 12 max)
- No emoji as icons
- No colored buttons except black primary
