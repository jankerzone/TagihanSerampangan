// Colors a Monthly Report card can use. `value` is what's stored in settings.colors.
// Class names are written out in full so Tailwind can find them; the swatch in
// Settings uses the same background as the card, so what you pick is what you get.
export const cardColors = [
  { value: 'green-100', name: 'Green', classes: 'bg-green-200 border-green-300 text-green-800' },
  { value: 'teal-100', name: 'Teal', classes: 'bg-teal-200 border-teal-300 text-teal-800' },
  { value: 'cyan-100', name: 'Cyan', classes: 'bg-cyan-200 border-cyan-300 text-cyan-800' },
  { value: 'blue-100', name: 'Blue', classes: 'bg-blue-200 border-blue-300 text-blue-800' },
  { value: 'indigo-100', name: 'Indigo', classes: 'bg-indigo-200 border-indigo-300 text-indigo-800' },
  { value: 'purple-100', name: 'Purple', classes: 'bg-purple-200 border-purple-300 text-purple-800' },
  { value: 'pink-100', name: 'Pink', classes: 'bg-pink-200 border-pink-300 text-pink-800' },
  { value: 'red-100', name: 'Red', classes: 'bg-red-200 border-red-300 text-red-800' },
  { value: 'orange-100', name: 'Orange', classes: 'bg-orange-200 border-orange-300 text-orange-800' },
  { value: 'yellow-100', name: 'Yellow', classes: 'bg-yellow-200 border-yellow-300 text-yellow-800' },
];

export const defaultCardColors = {
  income: 'green-100',
  savings: 'blue-100',
  budgeted_expenses: 'orange-100',
  spending: 'red-100',
};

export function getCardColor(value: string | undefined, fallback: string) {
  return cardColors.find(c => c.value === value)
    ?? cardColors.find(c => c.value === fallback)!;
}
