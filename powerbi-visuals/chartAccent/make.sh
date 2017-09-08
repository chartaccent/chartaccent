#!/bin/bash

echo "Bar chart..."
rm -rf .tmp
cp pbiviz.barchart.json pbiviz.json
pbiviz package

echo "Line chart..."
rm -rf .tmp
cp pbiviz.linechart.json pbiviz.json
pbiviz package

echo "Scatterplot..."
rm -rf .tmp
cp pbiviz.scatterplot.json pbiviz.json
pbiviz package
