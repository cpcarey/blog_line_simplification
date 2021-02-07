import * as d3 from 'd3';
import {Feature, FeatureCollection, GeoJsonProperties, GeometryCollection, Geometry, MultiPolygon, Polygon, Position} from 'geojson';
import * as topojson from 'topojson-client';

type P = GeoJsonProperties;
type Region = MultiPolygon|Polygon;


function reduce(id: string, n: number) {
  geoRegionMap.set(id, JSON.parse(jsonMap.get(id)));
  const featureCollection: FeatureCollection<Polygon, P> = geoRegionMap.get(id);

  for (const feature of featureCollection.features) {
    switch (String(feature.geometry.type)) {
      case 'MultiPolygon':
        reduceMultiPolygon(feature.geometry as unknown as MultiPolygon, n);
        break;
      case 'Polygon':
        reducePolygon(feature.geometry, n);
        break;
      default:
        throw new Error('Unsupported geometry type.');
    }

  }
}

function reducePolygon(polygon: Polygon, n: number) {
  for (const positions of polygon.coordinates) {
    const filteredPositions: Position[] = filterPositions(positions, n);
    positions.splice(0, positions.length, ...filteredPositions);
  }
}

function reduceMultiPolygon(multiPolygon: MultiPolygon, n: number) {
  for (const coordinates of multiPolygon.coordinates) {
    for (const positions of coordinates) {
      const filteredPositions: Position[] = filterPositions(positions, n);
      positions.splice(0, positions.length, ...filteredPositions);
    }
    coordinates.splice(0, coordinates.length, ...coordinates.filter((positions: Position[]) => positions.length > 6));
  }
}

function filterPositions(positions: Position[], n: number): Position[] {
  return positions.filter((position: Position, index: number) => {
    //return index % n == 0 || index == 0 || index == positions.length - 1;
    return Math.random() < n || index == 0 || index == positions.length - 1;
  });
}

const regionIds: string[] = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL',
  'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT',
  'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const geoRegionMap = new Map<string, FeatureCollection<Polygon, P>>([]);
const jsonMap = new Map<string, string>([]);

function loadRegions() {
  for (const regionId of regionIds) {
    const featureCollection: FeatureCollection<Polygon, P> =
        require(`../assets/USA/${regionId}.geo.json`);
    geoRegionMap.set(regionId, featureCollection);
    jsonMap.set(regionId, JSON.stringify(featureCollection));
  }
}

const colors = [
  '#ffffff', '#f2edf8', '#e5dbf0', '#d8c9e9', '#cbb7e1', '#bea4da', '#b192d3',
  '#a580cb', '#986ec4', '#8b5cbc', '#7e4ab5', '#7143a3', '#673d94', '#653b91',
  '#58347f', '#4b2c6d', '#3f255b', '#321e48',
];

function executeRandomDance() {
  let n = 0.75;
  let intervalMs = 100;
  let intervalId = setInterval(() => {
    function update(id: string) {
      reduce(id, n);
      let path = d3.select(`g#${id} path`);
      if (path.empty()) {
        path =
            d3.select('svg')
              .append('g')
              .attr('id', id)
              .attr('fill', 'none')
              .attr('stroke', colors[Math.floor(Math.random() * colors.length)])
              .attr('stroke-width', '2')
              .attr('stroke-linejoin', 'round')
              .attr('stroke-linecap', 'round')
              .append('path');
      }

      path.attr('d', d3.geoPath().projection(d3.geoAlbers())(geoRegionMap.get(id)));
    }

    for (const regionId of regionIds) {
      update(regionId);
    }
  }, intervalMs);
}

loadRegions();
executeRandomDance();
