document.addEventListener("DOMContentLoaded", function () {
  // Obtener elementos del DOM
  const meanInput = document.getElementById("mean");
  const stdDevInput = document.getElementById("stdDev");
  const sampleSizeInput = document.getElementById("sampleSize");
  const probabilityRadios = document.getElementsByName("probability");
  const value1Input = document.getElementById("value1");
  const value2Input = document.getElementById("value2");
  const value1Group = document.getElementById("value1Group");
  const value2Group = document.getElementById("value2Group");
  const calculateBtn = document.getElementById("calculateBtn");
  const togglePopulationBtn = document.getElementById("toggleFinitePopulation");
  const finitePopulationSection = document.getElementById(
    "finitePopulationSection"
  );
  const populationSizeInput = document.getElementById("populationSize");
  const correctionInfo = document.getElementById("correctionInfo");

  // Elementos de resultados
  const sampleMeanResult = document.getElementById("sampleMeanResult");
  const stdErrorResult = document.getElementById("stdErrorResult");
  const probabilityResult = document.getElementById("probabilityResult");
  const zScoreResult = document.getElementById("zScoreResult");

  // Gráfico
  const ctx = document.getElementById("distributionGraph").getContext("2d");
  let distributionChart = null;

  // Manejar cambios en los radio buttons de probabilidad
  probabilityRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "between") {
        value1Group.querySelector("label").textContent = "Valor 1:";
        value2Group.style.display = "block";
      } else {
        value1Group.querySelector("label").textContent = "Valor:";
        value2Group.style.display = "none";
      }
    });
  });

  // Manejar el toggle de población finita
  togglePopulationBtn.addEventListener("click", function () {
    if (finitePopulationSection.style.display === "none") {
      finitePopulationSection.style.display = "block";
      togglePopulationBtn.innerHTML =
        '<i class="fas fa-times"></i> Ocultar Población Finita';
      togglePopulationBtn.classList.add("active");
    } else {
      finitePopulationSection.style.display = "none";
      togglePopulationBtn.innerHTML =
        '<i class="fas fa-calculator"></i> Población Finita';
      togglePopulationBtn.classList.remove("active");
      populationSizeInput.value = "";
      correctionInfo.style.display = "none";
    }
  });

  // Calcular probabilidad
  calculateBtn.addEventListener("click", function () {
    // Validar entradas
    if (!validateInputs()) return;

    // Obtener valores
    const mean = parseFloat(meanInput.value);
    const stdDev = parseFloat(stdDevInput.value);
    const sampleSize = parseInt(sampleSizeInput.value);
    const value1 = parseFloat(value1Input.value);
    const value2 = probabilityRadios[2].checked
      ? parseFloat(value2Input.value)
      : null;
    const populationSize =
      finitePopulationSection.style.display === "block"
        ? parseInt(populationSizeInput.value)
        : null;

    // Calcular distribución muestral
    const sampleMean = mean;
    const { stdError, appliedCorrection } = calculateStandardError(
      stdDev,
      sampleSize,
      populationSize
    );

    // Mostrar resultados de distribución
    sampleMeanResult.textContent = sampleMean.toFixed(4);
    stdErrorResult.textContent = stdError.toFixed(4);

    if (appliedCorrection) {
      correctionInfo.style.display = "block";
    } else {
      correctionInfo.style.display = "none";
    }

    // Calcular probabilidad según la opción seleccionada
    let probability, z1, z2;

    if (probabilityRadios[0].checked) {
      // P(X̄ ≤ valor)
      z1 = (value1 - sampleMean) / stdError;
      probability = normalCDF(-Infinity, z1);
      zScoreResult.textContent = z1.toFixed(4);
    } else if (probabilityRadios[1].checked) {
      // P(X̄ ≥ valor)
      z1 = (value1 - sampleMean) / stdError;
      probability = normalCDF(z1, Infinity);
      zScoreResult.textContent = z1.toFixed(4);
    } else {
      // P(valor1 ≤ X̄ ≤ valor2)
      z1 = (value1 - sampleMean) / stdError;
      z2 = (value2 - sampleMean) / stdError;
      probability = normalCDF(z1, z2);
      zScoreResult.textContent = `${z1.toFixed(4)}, ${z2.toFixed(4)}`;
    }

    // Mostrar resultado de probabilidad
    probabilityResult.textContent =
      probability.toFixed(6) + ` (${(probability * 100).toFixed(2)}%)`;

    // Actualizar gráfico
    updateChart(sampleMean, stdError, value1, value2);
  });

  // Función para validar entradas
  function validateInputs() {
    if (
      !meanInput.value ||
      !stdDevInput.value ||
      !sampleSizeInput.value ||
      !value1Input.value
    ) {
      alert("Por favor complete todos los campos requeridos.");
      return false;
    }

    if (stdDevInput.value <= 0) {
      alert("La desviación estándar debe ser mayor que cero.");
      return false;
    }

    if (sampleSizeInput.value < 1) {
      alert("El tamaño de muestra debe ser al menos 1.");
      return false;
    }

    if (probabilityRadios[2].checked && !value2Input.value) {
      alert("Por favor ingrese el segundo valor para calcular el rango.");
      return false;
    }

    if (
      probabilityRadios[2].checked &&
      parseFloat(value1Input.value) > parseFloat(value2Input.value)
    ) {
      alert("El valor 1 debe ser menor que el valor 2.");
      return false;
    }

    // Validaciones para población finita
    if (finitePopulationSection.style.display === "block") {
      if (!populationSizeInput.value) {
        alert("Por favor ingrese el tamaño de la población (N)");
        return false;
      }

      const populationSize = parseInt(populationSizeInput.value);
      const sampleSize = parseInt(sampleSizeInput.value);

      if (populationSize < 2) {
        alert("El tamaño de población (N) debe ser al menos 2");
        return false;
      }

      if (sampleSize >= populationSize) {
        alert(
          "El tamaño de muestra (n) debe ser menor que el tamaño de población (N)"
        );
        return false;
      }
    }

    return true;
  }

  // Función para calcular el error estándar
  function calculateStandardError(stdDev, sampleSize, populationSize) {
    let finitePopulationCorrection = 1;
    let appliedCorrection = false;

    if (populationSize && sampleSize > 0 && populationSize > 1) {
      const samplingFraction = sampleSize / populationSize;
      if (samplingFraction > 0.05) {
        finitePopulationCorrection = Math.sqrt(
          (populationSize - sampleSize) / (populationSize - 1)
        );
        appliedCorrection = true;
      }
    }

    const stdError =
      (stdDev / Math.sqrt(sampleSize)) * finitePopulationCorrection;
    return { stdError, appliedCorrection };
  }

  // Función para calcular la CDF normal estándar
  function normalCDF(z1, z2) {
    // Usamos la aproximación de la función de error para calcular la CDF
    function erf(x) {
      // constants
      const a1 = 0.254829592;
      const a2 = -0.284496736;
      const a3 = 1.421413741;
      const a4 = -1.453152027;
      const a5 = 1.061405429;
      const p = 0.3275911;

      // Save the sign of x
      const sign = x < 0 ? -1 : 1;
      x = Math.abs(x);

      // A&S formula 7.1.26
      const t = 1.0 / (1.0 + p * x);
      const y =
        1.0 -
        ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

      return sign * y;
    }

    function cdf(z) {
      return 0.5 * (1 + erf(z / Math.sqrt(2)));
    }

    return cdf(z2) - cdf(z1);
  }

  // Función para actualizar el gráfico
  function updateChart(mean, stdDev, value1, value2) {
    // Configuración del gráfico
    const chartData = {
      labels: [],
      datasets: [
        {
          label: "Distribución Normal",
          data: [],
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          fill: true,
        },
        {
          label: "Área de Probabilidad",
          data: [],
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
          fill: true,
        },
      ],
    };

    // Calcular rango para el gráfico (4 desviaciones estándar en cada dirección)
    const minX = mean - 4 * stdDev;
    const maxX = mean + 4 * stdDev;
    const step = (maxX - minX) / 100;

    // Generar puntos para la curva normal
    for (let x = minX; x <= maxX; x += step) {
      chartData.labels.push(x.toFixed(2));

      // Calcular densidad de probabilidad normal
      const pdf =
        (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));

      chartData.datasets[0].data.push(pdf);

      // Determinar si el punto está en el área de probabilidad
      let inArea = false;
      const selectedProbability = document.querySelector(
        'input[name="probability"]:checked'
      ).value;

      if (selectedProbability === "lessThan" && x <= value1) {
        inArea = true;
      } else if (selectedProbability === "greaterThan" && x >= value1) {
        inArea = true;
      } else if (
        selectedProbability === "between" &&
        x >= value1 &&
        x <= value2
      ) {
        inArea = true;
      }

      chartData.datasets[1].data.push(inArea ? pdf : 0);
    }

    // Configuración de opciones del gráfico
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: "Valores de X̄",
            font: {
              weight: "bold",
            },
          },
        },
        y: {
          title: {
            display: true,
            text: "Densidad de Probabilidad",
            font: {
              weight: "bold",
            },
          },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              label += context.parsed.y.toFixed(5);
              return label;
            },
          },
        },
      },
    };

    // Destruir el gráfico anterior si existe
    if (distributionChart) {
      distributionChart.destroy();
    }

    // Crear nuevo gráfico
    distributionChart = new Chart(ctx, {
      type: "line",
      data: chartData,
      options: chartOptions,
    });
  }

  // Inicializar gráfico con valores por defecto
  updateChart(0, 1, -1, 1);
});
