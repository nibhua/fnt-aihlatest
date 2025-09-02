"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Target,
  BarChart3,
  Lightbulb,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { QueryHit, analyzeRelevance } from "@/lib/api";

interface MoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: QueryHit | null;
  selectedText?: string;
}

interface RelevanceAnalysis {
  relevance_score?: number;
  confidence_level: "high" | "medium" | "low";
  explanation: string;
  key_connections: string[];
  supporting_evidence: string[];
  relevance_type?: string;
  shared_concepts?: string[];
  relationship_strength?: string;
  additional_insights?: string;
  potential_follow_up?: string;
}

export function MoreInfoModal({
  isOpen,
  onClose,
  result,
  selectedText,
}: MoreInfoModalProps) {
  const [relevanceAnalysis, setRelevanceAnalysis] =
    useState<RelevanceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && result && selectedText) {
      analyzeRelevanceForResult();
    }
  }, [isOpen, result, selectedText]);

  const analyzeRelevanceForResult = async () => {
    if (!result || !selectedText) return;

    setLoading(true);
    setError(null);

    try {
      const response = await analyzeRelevance(
        selectedText,
        {
          file_name: result.file_name,
          page: result.page,
          snippet: result.snippet,
          heading: result.heading,
          score: result.score,
        },
        "detailed"
      );

      console.log("API Response:", response);

      // ✅ Always use normalized `response.analysis`
      const a = response.analysis;
      const analysis: RelevanceAnalysis = {
        relevance_score: a.relevance_score,
        confidence_level: a.confidence_level || "medium",
        explanation: a.explanation || "No explanation available",
        key_connections: a.key_connections || [],
        supporting_evidence: a.supporting_evidence || [],
        relevance_type: a.relevance_type,
        shared_concepts: a.shared_concepts,
        relationship_strength: a.relationship_strength,
        additional_insights: a.additional_insights,
        potential_follow_up: a.potential_follow_up,
      };

      setRelevanceAnalysis(analysis);
    } catch (err) {
      console.error("Failed to analyze relevance:", err);
      setError("Failed to analyze relevance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!result) return null;

  const getConfidenceLevel = (score?: number, level?: string) => {
    if (score !== undefined) {
      if (score >= 0.8) return "high";
      if (score >= 0.5) return "medium";
      return "low";
    }
    return (level || "medium").toLowerCase();
  };

  const getConfidenceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "text-green-600 bg-green-100 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "low":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getConfidenceLabel = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "High Confidence";
      case "medium":
        return "Medium Confidence";
      case "low":
        return "Low Confidence";
      default:
        return "Unknown Confidence";
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return <CheckCircle className="w-4 h-4" />;
      case "medium":
        return <AlertCircle className="w-4 h-4" />;
      case "low":
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  // ✅ Fixed: Clamp value at 100 max so bar never exceeds
  const getConfidencePercentage = (score?: number, level?: string) => {
    if (score !== undefined) {
      return Math.min(Math.round(score * 100), 100);
    }
    switch ((level || "medium").toLowerCase()) {
      case "high":
        return 90;
      case "medium":
        return 60;
      case "low":
        return 30;
      default:
        return 50;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#ff0000]/10 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#ff0000]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Result Details
              </DialogTitle>
              <p className="text-sm text-gray-600">
                {result.file_name} — Page {result.page}
              </p>
            </div>
          </div>
          <Button
            onClick={analyzeRelevanceForResult}
            disabled={loading || !selectedText}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 bg-transparent"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Refresh Analysis</span>
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Result Content */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-[#ff0000]" />
                  Result Content
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Rank:</span>
                  <span className="bg-[#ff0000] text-white text-xs px-2 py-1 rounded-full">
                    {result.rank}
                  </span>
                </div>
              </div>

              {result.heading && (
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-1">Heading</h4>
                  <p className="text-gray-700 text-sm">{result.heading}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.snippet}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confidence Level */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-[#ff0000]" />
                  Confidence Level
                </h3>
                {relevanceAnalysis && (
                  <div
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getConfidenceColor(
                      getConfidenceLevel(
                        relevanceAnalysis.relevance_score,
                        relevanceAnalysis.confidence_level
                      )
                    )}`}
                  >
                    {getConfidenceIcon(
                      getConfidenceLevel(
                        relevanceAnalysis.relevance_score,
                        relevanceAnalysis.confidence_level
                      )
                    )}
                    <span className="text-sm font-medium">
                      {getConfidenceLabel(
                        getConfidenceLevel(
                          relevanceAnalysis.relevance_score,
                          relevanceAnalysis.confidence_level
                        )
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getConfidenceLevel(
                      relevanceAnalysis?.relevance_score,
                      relevanceAnalysis?.confidence_level
                    ) === "high"
                      ? "bg-green-500"
                      : getConfidenceLevel(
                          relevanceAnalysis?.relevance_score,
                          relevanceAnalysis?.confidence_level
                        ) === "medium"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${getConfidencePercentage(
                      relevanceAnalysis?.relevance_score,
                      relevanceAnalysis?.confidence_level
                    )}%`,
                  }}
                ></div>
              </div>

              <p className="text-sm text-gray-600">
                AI analysis indicates{" "}
                {getConfidenceLevel(
                  relevanceAnalysis?.relevance_score,
                  relevanceAnalysis?.confidence_level
                )}{" "}
                confidence in the relevance of this result to your query.
              </p>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {selectedText && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-[#ff0000]" />
                    AI Relevance Analysis
                  </h3>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 text-[#ff0000] animate-spin mr-2" />
                    <span className="text-gray-600">Analyzing relevance...</span>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                    <Button
                      onClick={analyzeRelevanceForResult}
                      variant="outline"
                      size="sm"
                      className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : relevanceAnalysis ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Why This Result is Relevant
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-sm leading-relaxed">
                          {relevanceAnalysis.explanation}
                        </p>
                      </div>
                    </div>

                    {relevanceAnalysis.relevance_type && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Relevance Type
                        </h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <span className="text-sm text-gray-700 capitalize">
                            {relevanceAnalysis.relevance_type.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    )}

                    {relevanceAnalysis.relationship_strength && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Relationship Strength
                        </h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <span className="text-sm text-gray-700 capitalize">
                            {relevanceAnalysis.relationship_strength}
                          </span>
                        </div>
                      </div>
                    )}

                    {relevanceAnalysis.key_connections &&
                      relevanceAnalysis.key_connections.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Key Connections
                          </h4>
                          <div className="space-y-2">
                            {relevanceAnalysis.key_connections.map(
                              (connection, index) => (
                                <div
                                  key={index}
                                  className="flex items-start space-x-2 bg-gray-50 border border-gray-200 rounded-lg p-3"
                                >
                                  <Target className="w-4 h-4 text-[#ff0000] mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-700">
                                    {connection}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {relevanceAnalysis.shared_concepts &&
                      relevanceAnalysis.shared_concepts.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Shared Concepts
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {relevanceAnalysis.shared_concepts.map(
                              (concept, index) => (
                                <span
                                  key={index}
                                  className="bg-[#ff0000]/10 text-[#ff0000] text-xs px-2 py-1 rounded-full border border-[#ff0000]/20"
                                >
                                  {concept}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {relevanceAnalysis.supporting_evidence &&
                      relevanceAnalysis.supporting_evidence.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Supporting Evidence
                          </h4>
                          <div className="space-y-2">
                            {relevanceAnalysis.supporting_evidence.map(
                              (evidence, index) => (
                                <div
                                  key={index}
                                  className="flex items-start space-x-2 bg-gray-50 border border-gray-200 rounded-lg p-3"
                                >
                                  <div className="w-2 h-2 bg-[#ff0000] rounded-full mt-2 flex-shrink-0" />
                                  <span className="text-sm text-gray-700">
                                    {evidence}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {relevanceAnalysis.additional_insights && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Additional Insights
                        </h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-green-800 text-sm leading-relaxed">
                            {relevanceAnalysis.additional_insights}
                          </p>
                        </div>
                      </div>
                    )}

                    {relevanceAnalysis.potential_follow_up && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Potential Follow-up Questions
                        </h4>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <p className="text-purple-800 text-sm leading-relaxed">
                            {relevanceAnalysis.potential_follow_up}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">
                      Click "Refresh Analysis" to get AI insights about this
                      result.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
