# ChartAccent

An online tool to help people create and annotate charts. See <https://chartaccent.github.io/>.

## How to build

What you need:

- nodejs 6.0+
- python 2.7+
- ruby 2.4+

Get the code via github:

    git clone https://github.com/chartaccent/chartaccent.git
    cd chartaccent

Install required nodejs packages:

    npm install

Install python modules

    # requests >= 2.18.4
    pip2.7 install requests
    
Install ruby modules

    # sass >= 3.5.4
    gem install sass

Build the project:

    python scripts/make_roboto_standalone_css.py
    npm run build

Serve the project at `localhost:8000`:

    npm run serve

## Develop

Start watch mode:

    npm run watch

Once this is running, you can edit the code in `src/ts`, and see the changes immediately at `localhost:8000`.

The code in `chart-accent`, however, requires an additional build step, just run the following to build them when you change it.

    npm run build:chartaccent
