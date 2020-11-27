<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
***
***
***
*** To avoid retyping too much info. Do a search and replace for the following:
*** JorgeBarMza, n-body-simulation, jorgebarmza@gmail.com, n-body simulation, An interactive 3D web app to visualize celestial mechanics.
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/JorgeBarMza/n-body-simulation">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">n-body simulation</h3>

  <p align="center">
    A 3D web app to visualize celestial mechanics.
    <br />
    <a href="https://github.com/JorgeBarMza/n-body-simulation">View Demo</a>
    ·
    <a href="https://github.com/JorgeBarMza/n-body-simulation/issues">Report Bug or Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Table of Contents</h2></summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
        <li><a href="#built-with">Math</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://example.com)

An interactive 3D web app that simulates a dynamical system of particles under the influence of gravity. 

### Built With

* [ODEX](https://github.com/littleredcomputer/odex-js)
* [Three.js](https://threejs.org/)
TODO: Add the rest.

### Math

Movement is modelled by a sytem of nonlinear ordinary differential equations based on Newtonian mechanics. Numerical integration methods are suitable to obtain the position and velocity of all bodies at arbitrarilly chosen timesteps, this project uses the Gragg-Bulirsch-Stoer algorithm. 

The system can be described by equating the net force on each object to the sum of gravitational pulls of all other bodies. This yields a system of second order ODEs where position as a function of time is the unknown variable. Each equation can be transformed into two first order ODEs, which facilitates the computations.  

<!- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/JorgeBarMza/n-body-simulation.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
2. Run the build
   ```sh
   npm run build
   ```
TODO: add liveserver step.

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->
## Contact

Jorge Barrios - jorgebarmza@gmail.com

<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements

Thanks [Octavio Navarro](https://github.com/octavio-navarro) for providing valuable guidance and advice.






<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/JorgeBarMza/n-body-simulation.svg?style=for-the-badge
[contributors-url]: https://github.com/JorgeBarMza/n-body-simulation/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/JorgeBarMza/n-body-simulation.svg?style=for-the-badge
[forks-url]: https://github.com/JorgeBarMza/n-body-simulation/network/members
[stars-shield]: https://img.shields.io/github/stars/JorgeBarMza/n-body-simulation.svg?style=for-the-badge
[stars-url]: https://github.com/JorgeBarMza/n-body-simulation/stargazers
[issues-shield]: https://img.shields.io/github/issues/JorgeBarMza/n-body-simulation.svg?style=for-the-badge
[issues-url]: https://github.com/JorgeBarMza/n-body-simulation/issues
[license-shield]: https://img.shields.io/github/license/JorgeBarMza/n-body-simulation.svg?style=for-the-badge
[license-url]: https://github.com/JorgeBarMza/n-body-simulation/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555