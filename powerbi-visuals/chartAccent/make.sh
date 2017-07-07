#!/bin/bash

rm -rf .tmp
cp pbiviz.barchart.json pbiviz.json
pbiviz package

rm -rf .tmp
cp pbiviz.linechart.json pbiviz.json
pbiviz package

rm -rf .tmp
cp pbiviz.scatterplot.json pbiviz.json
pbiviz package