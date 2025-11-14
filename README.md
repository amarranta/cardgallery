## cardgallery
A small static postcard gallery built with **Astro**.  
I use it for my personal postcard collection, and it can also be useful for others who want a simple way to browse postcard sets with tags.  
Images are stored on **Cloudinary**, and the site fetches metadata to generate static JSON before build.

## Features
- Browse postcards with tags and basic filtering  
- Fully static website (deployed on GitHub Pages)  
- Metadata fetched from Cloudinary and converted into JSON  
- Utility scripts for validating and preparing data  
- Easy to update the gallery by re-fetching data

## Image handling
The website is static.  
All images live in **Cloudinary**, which provides:
- storage for postcard scans  
- folders/tags metadata  
- the data used to generate JSON at build time

## Tech stack
- Astro  
- Cloudinary API  
- GitHub Pages  
- Node-based utility scripts

## Purpose
- Keep my postcard collection organized and easy to browse  
- Provide a simple viewer that requires no backend  
- Add lightweight automation for fetching and structuring image metadata
