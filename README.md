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

The n-body problem consists of predicting the movement of n particles given their masses, initial positions, and velocities.

Movement is influenced by gravitational force between the particles. 
The force exerted from mass *j* and received by mass *i* is described by Newton's law of gravity:

![](https://latex.codecogs.com/svg.latex?\large&space;F_{ij}=\frac{Gm_im_j}{{\|&space;r_j&space;-&space;r_i&space;\|}^2}&space;\cdot&space;\frac{(r_j&space;-&space;r_i)}{\|&space;r_j&space;-&space;r_i&space;\|}&space;=&space;\frac{Gm_im_j(r_j-r_i)}{{\|&space;r_j&space;-&space;r_i&space;\|}^3})

Where *G* is the gravitational constant, *r* is the position vector of a body as a function of time, and |v| denotes the euclidean norm. 

By Newton's second law, we associate the sum all forces affecting a body with its acceleration.

![](https://latex.codecogs.com/svg.latex?\large&space;m_i&space;{r_i}''&space;=&space;\sum_{\substack{j&space;=&space;1&space;\\&space;j&space;\ne&space;i}}^n&space;F_{ij})

After substitution and simplification, we obtain a system of second order ODEs, one equation per body.

![](https://latex.codecogs.com/svg.latex?\large&space;{r_i}''&space;=&space;\sum_{\substack{j&space;=&space;1&space;\\&space;j&space;\ne&space;i}}^n&space;\frac{Gm_j(r_j-r_i)}{{\|&space;r_j-r_i&space;\|}^3})

Where each second order equation can be transformed into two first order ODEs.

![](https://latex.codecogs.com/svg.latex?\large&space;v_i'&space;=&space;\sum_{\substack{j&space;=&space;1&space;\\&space;j&space;\ne&space;i}}^n&space;\frac{Gm_j(r_j-r_i)}{{\|&space;r_j-r_i&space;\|}^3})

![](https://latex.codecogs.com/svg.latex?\large&space;r_i'&space;=&space;v_i)

Hence, each body yields two vector equations, or six scalar equations in a 3D coordinate system. The numerical solver inegrates this system to obtain the velocity and position of all bodies as a function of time.  

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