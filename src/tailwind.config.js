@@ .. @@
       animation: {
         'fade-in': 'fadeIn 0.3s ease-in-out',
         'slide-down': 'slideDown 0.5s ease-out',
-        'breathe': 'breathe 12s ease-in-out infinite',
       },
-        'slide-up-reverse': 'slideUpReverse 0.7s ease-out',
       keyframes: {
-        breathe: {
-          '0%, 100%': { 
-            opacity: '0.6',
-            transform: 'scale(1)',
-          },
-          '50%': { 
-            opacity: '1',
-            transform: 'scale(1.1)',
-          },
-        },
         fadeIn: {
           '0%': { height: '80px', opacity: '0.9' },
           '100%': { height: '280px', opacity: '1' },