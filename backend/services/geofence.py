"""
VIGIL-AI Geospatial Engine
Haversine formula implementation for GPS geofencing.

The Haversine Formula calculates the great-circle distance between
two points on a sphere given their longitudes and latitudes.

Formula:
  a = sin²(Δφ/2) + cos(φ1) · cos(φ2) · sin²(Δλ/2)
  c = 2 · atan2(√a, √(1−a))
  d = R · c

Where:
  φ = latitude in radians
  λ = longitude in radians
  R = Earth's radius (6,371,000 meters)
  Δφ = difference in latitudes
  Δλ = difference in longitudes
"""

import math


# Earth's mean radius in meters
EARTH_RADIUS_METERS = 6_371_000


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth
    using the Haversine formula.

    Args:
        lat1: Latitude of point 1 in decimal degrees.
        lon1: Longitude of point 1 in decimal degrees.
        lat2: Latitude of point 2 in decimal degrees.
        lon2: Longitude of point 2 in decimal degrees.

    Returns:
        Distance between the two points in meters.

    Example:
        >>> haversine_distance(28.6139, 77.2090, 28.6140, 77.2091)
        ~14.0  # About 14 meters apart
    """
    # Step 1: Convert decimal degrees to radians
    # Python's math.radians() converts degrees to radians: rad = deg × (π/180)
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)  # Δφ — difference in latitude
    delta_lambda = math.radians(lon2 - lon1)  # Δλ — difference in longitude

    # Step 2: Apply the Haversine formula
    # a = sin²(Δφ/2) + cos(φ1) · cos(φ2) · sin²(Δλ/2)
    # This formula gives the square of the half-chord length between the points
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )

    # Step 3: Calculate the angular distance in radians
    # c = 2 · atan2(√a, √(1−a))
    # atan2 is used instead of asin for better numerical stability
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    # Step 4: Calculate the distance
    # d = R · c (Earth's radius × angular distance)
    distance = EARTH_RADIUS_METERS * c

    return distance


def is_within_geofence(
    teacher_lat: float,
    teacher_lon: float,
    student_lat: float,
    student_lon: float,
    radius_meters: int = 20,
) -> dict:
    """
    Check if a student is within the geofenced area around the teacher's location.

    The geofence is a circle centered at the teacher's GPS coordinates with a
    configurable radius (default 20 meters — roughly the size of a classroom).

    Args:
        teacher_lat: Teacher's latitude (session GPS).
        teacher_lon: Teacher's longitude (session GPS).
        student_lat: Student's current latitude.
        student_lon: Student's current longitude.
        radius_meters: Geofence radius in meters (default: 20m).

    Returns:
        Dictionary with:
            - within_geofence (bool): Whether the student is inside the fence.
            - distance_meters (float): Actual distance between the two points.
            - radius_meters (int): The geofence radius used.
            - message (str): Human-readable status message.
    """
    distance = haversine_distance(teacher_lat, teacher_lon, student_lat, student_lon)
    within = distance <= radius_meters

    return {
        "within_geofence": within,
        "distance_meters": round(distance, 2),
        "radius_meters": radius_meters,
        "message": (
            f"✅ Within range ({distance:.1f}m / {radius_meters}m)"
            if within
            else f"❌ Outside range ({distance:.1f}m / {radius_meters}m)"
        ),
    }
