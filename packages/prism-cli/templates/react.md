# React.js Stack Template

> **Stack**: react  
> **Version**: React 18+  
> **Build Tool**: Vite or CRA

## Project Structure

```
src/
├── components/
│   ├── ui/           # Primitive components (Button, Input, Card)
│   ├── layout/       # Layout components (Header, Footer, Sidebar)
│   └── features/     # Feature-specific components
├── hooks/            # Custom React hooks
├── utils/            # Helper functions
├── styles/           # CSS/SCSS files
└── App.tsx
```

## Component Pattern

```tsx
import { type FC, type ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

## Styling Approach

### CSS Modules (Default)
```tsx
import styles from './Button.module.css';

<button className={styles.button}>Click</button>
```

### Tailwind CSS (If Installed)
```tsx
<button className="px-4 py-2 rounded-md bg-blue-500 text-white">
  Click
</button>
```

## State Management

### Local State
```tsx
const [isOpen, setIsOpen] = useState(false);
```

### Complex State (useReducer)
```tsx
const [state, dispatch] = useReducer(reducer, initialState);
```

## Hooks Pattern

```tsx
// Custom hook for data fetching
export function useData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
```

## Event Handling

```tsx
// Typed event handlers
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // Handle form submission
};
```

## Performance Patterns

```tsx
// Memoization
const MemoizedComponent = React.memo(ExpensiveComponent);

// Callback memoization
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Value memoization
const computed = useMemo(() => expensiveCalculation(data), [data]);
```

## Accessibility (A11y)

- Use semantic HTML elements
- Add `aria-label` for icon buttons
- Ensure keyboard navigation works
- Maintain focus management in modals

```tsx
<button
  aria-label="Close dialog"
  onClick={onClose}
>
  <CloseIcon />
</button>
```

---

## AI Generation Rules

When generating React components:

1. **Always use TypeScript** with proper interfaces
2. **Use functional components** with FC type
3. **Props destructuring** with defaults
4. **No class components** unless explicitly requested
5. **Export as named export** (not default)
6. **Include prop types** in a separate interface
7. **Use semantic HTML** where possible
