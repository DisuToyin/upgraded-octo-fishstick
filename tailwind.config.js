
module.exports = {
    content: ["./index.html", "./src/**/*.{html,js}"],
    theme: {
      extend: {
        fontFamily: {
            'tomorrow': ['Tomorrow', 'sans-serif'],
            'instrument': ['Instrument Sans', 'sans-serif']
          
        },
        colors: {
            'main': '#1E1E1E',
            'hero': '#F2F4F7',
            'sub': '#767676'
        },
      },
    },
    plugins: [],
  }